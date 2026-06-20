import { GGUFMetadata, GGUFModelInfo } from '../types';

/**
 * Highly optimized slice-based local GGUF metadata parser.
 * Reads only the first 2MB of any GGUF file (which contains the header and KV metadata)
 * preventing memory buffer overflows or browser tab crashing.
 */
export async function parseGGUFHeader(file: File): Promise<GGUFMetadata> {
  const HEADER_CHECK_SIZE = 2 * 1024 * 1024; // Slice first 2MB
  const blobSlice = file.slice(0, HEADER_CHECK_SIZE);
  const arrayBuffer = await blobSlice.arrayBuffer();
  const view = new DataView(arrayBuffer);

  let offset = 0;

  // 1. Check Magic (4 bytes) - 'GGUF' (0x46554747 in little-endian or 0x47475546 in big-endian)
  if (arrayBuffer.byteLength < 4) {
    throw new Error('File is too small to be a GGUF model.');
  }

  const magicNum = view.getUint32(offset, true);
  offset += 4;

  const magicHex = magicNum.toString(16).toUpperCase();
  // 'GGUF' characters in hexadecimal are G=47, G=47, U=55, F=46 => 46554747 in little-endian representation
  const isGGUF = magicHex === '46554747' || magicHex === '47475546';
  if (!isGGUF) {
    throw new Error('Invalid model file. The magic header does not match the GGUF specification.');
  }

  const magicStr = 'GGUF';

  // 2. Version (uint32)
  if (offset + 4 > arrayBuffer.byteLength) throw new Error('Truncated GGUF: Version missing.');
  const version = view.getUint32(offset, true);
  offset += 4;

  if (version !== 2 && version !== 3 && version !== 1) {
    console.warn(`Untested GGUF version: v${version}. Standard variants are v2 or v3.`);
  }

  // 3. Tensor count (uint64)
  // 4. Metadata KV count (uint64)
  // Let's read these as uint64 (using two uint32 because JS numbers are up to 2^53 - 1)
  if (offset + 16 > arrayBuffer.byteLength) throw new Error('Truncated GGUF: Tensor count or KV count missing.');
  
  // Read tensor count
  const tensorCountLow = view.getUint32(offset, true);
  const tensorCountHigh = view.getUint32(offset + 4, true);
  const tensorCount = tensorCountLow + tensorCountHigh * 0x100000000;
  offset += 8;

  // Read Metadata KV count
  const kvCountLow = view.getUint32(offset, true);
  const kvCountHigh = view.getUint32(offset + 4, true);
  const metadataKVCount = kvCountLow + kvCountHigh * 0x100000000;
  offset += 8;

  const properties: Record<string, any> = {};
  const tensors: Array<{ name: string; type: string; dimensions: number[]; offset: number }> = [];

  // Helper to read a GGUF style string (uint64 length + UTF-8 bytes)
  const readGGUFString = (): string => {
    if (offset + 8 > arrayBuffer.byteLength) throw new Error('Truncated GGUF string length.');
    const strLenLow = view.getUint32(offset, true);
    const strLenHigh = view.getUint32(offset + 4, true);
    const strLen = strLenLow + strLenHigh * 0x100000000;
    offset += 8;

    if (offset + strLen > arrayBuffer.byteLength) {
      throw new Error(`Truncated GGUF string content. Length requested: ${strLen} bytes.`);
    }

    const bytes = new Uint8Array(arrayBuffer, offset, strLen);
    offset += strLen;
    return new TextDecoder().decode(bytes);
  };

  // Helper to read metadata value based on type
  const readGGUFValue = (typeId: number): any => {
    switch (typeId) {
      case 0: { // UINT8
        const val = view.getUint8(offset);
        offset += 1;
        return val;
      }
      case 1: { // INT8
        const val = view.getInt8(offset);
        offset += 1;
        return val;
      }
      case 2: { // UINT16
        const val = view.getUint16(offset, true);
        offset += 2;
        return val;
      }
      case 3: { // INT16
        const val = view.getInt16(offset, true);
        offset += 2;
        return val;
      }
      case 4: { // UINT32
        const val = view.getUint32(offset, true);
        offset += 4;
        return val;
      }
      case 5: { // INT32
        const val = view.getInt32(offset, true);
        offset += 4;
        return val;
      }
      case 6: { // FLOAT32
        const val = view.getFloat32(offset, true);
        offset += 4;
        return val;
      }
      case 7: { // BOOL
        const val = view.getUint8(offset) !== 0;
        offset += 1;
        return val;
      }
      case 8: { // STRING
        return readGGUFString();
      }
      case 9: { // ARRAY
        if (offset + 12 > arrayBuffer.byteLength) throw new Error('Truncated GGUF Array header.');
        const itemType = view.getUint32(offset, true);
        offset += 4;
        
        const arrayLenLow = view.getUint32(offset, true);
        const arrayLenHigh = view.getUint32(offset + 4, true);
        const arrayLen = arrayLenLow + arrayLenHigh * 0x100000000;
        offset += 8;

        const items: any[] = [];
        // Cap the parsed array elements to reasonable counts to keep browser stable if GGUF contains massive metadata list
        const maxSafeItems = Math.min(arrayLen, 128); 
        for (let i = 0; i < arrayLen; i++) {
          const itemVal = readGGUFValue(itemType);
          if (i < maxSafeItems) {
            items.push(itemVal);
          }
        }
        return items;
      }
      case 10: { // UINT64
        const valLow = view.getUint32(offset, true);
        const valHigh = view.getUint32(offset + 4, true);
        const val = valLow + valHigh * 0x100000000;
        offset += 8;
        return val;
      }
      case 11: { // INT64
        // Signed. Standard workaround
        const valLow = view.getUint32(offset, true);
        const valHigh = view.getInt32(offset + 4, true);
        const val = valLow + valHigh * 0x100000000;
        offset += 8;
        return val;
      }
      case 12: { // FLOAT64
        const val = view.getFloat64(offset, true);
        offset += 8;
        return val;
      }
      default:
        throw new Error(`Unknown GGUF metadata type ID: ${typeId}`);
    }
  };

  // 5. Parse Key-Value pairs
  try {
    for (let i = 0; i < metadataKVCount; i++) {
      if (offset >= arrayBuffer.byteLength) break;
      const key = readGGUFString();
      if (offset + 4 > arrayBuffer.byteLength) break;
      const valueType = view.getUint32(offset, true);
      offset += 4;
      const value = readGGUFValue(valueType);
      properties[key] = value;
    }
  } catch (e: any) {
    console.warn('GGUF metadata parsing finished with warnings (reached slice boundaries):', e.message);
  }

  // 6. Try to parse some tensor definitions if offset didn't hit boundary
  try {
    for (let i = 0; i < Math.min(tensorCount, 30); i++) {
      if (offset >= arrayBuffer.byteLength) break;
      const name = readGGUFString();
      
      if (offset + 4 > arrayBuffer.byteLength) break;
      const dimensionsCount = view.getUint32(offset, true);
      offset += 4;

      const dimensions: number[] = [];
      for (let d = 0; d < dimensionsCount; d++) {
        if (offset + 8 > arrayBuffer.byteLength) break;
        const dimLow = view.getUint32(offset, true);
        const dimHigh = view.getUint32(offset + 4, true);
        dimensions.push(dimLow + dimHigh * 0x100000000);
        offset += 8;
      }

      if (offset + 4 > arrayBuffer.byteLength) break;
      const tensorType = view.getUint32(offset, true);
      offset += 4;

      if (offset + 8 > arrayBuffer.byteLength) break;
      const tensorOffsetLow = view.getUint32(offset, true);
      const tensorOffsetHigh = view.getUint32(offset + 4, true);
      const tensorOffset = tensorOffsetLow + tensorOffsetHigh * 0x100000000;
      offset += 8;

      tensors.push({
        name,
        type: getGGUFTensorTypeName(tensorType),
        dimensions,
        offset: tensorOffset
      });
    }
  } catch (e: any) {
    // Expected boundary cutoffs
  }

  return {
    magic: magicStr,
    version,
    tensorCount,
    metadataKVCount,
    properties,
    tensors
  };
}

function getGGUFTensorTypeName(typeId: number): string {
  const types = [
    'F32', 'F16', 'Q4_0', 'Q4_1', 'Q4_2_UNUSED', 'Q4_3_UNUSED', 
    'Q5_0', 'Q5_1', 'Q8_0', 'Q8_1', 'Q2_K', 'Q3_K', 'Q4_K', 'Q5_K', 
    'Q6_K', 'Q8_K', 'IQ2_XXS', 'IQ2_XS', 'IQ3_XXS', 'IQ1_S', 'IQ4_NL', 
    'IQ3_S', 'IQ2_S', 'IQ4_XS', 'I8', 'I16', 'I32'
  ];
  return types[typeId] || `QUANT_ID_${typeId}`;
}

export function extractModelInfo(meta: GGUFMetadata, file: File): GGUFModelInfo {
  const props = meta.properties;
  
  // Try to find the name of the model
  const name = props['general.name'] || props['general.basename'] || file.name.replace(/\.gguf$/i, '').replace(/[-_.]/g, ' ');
  const architecture = props['general.architecture'] || 'unknown';
  
  // Try to analyze quantization type
  let quantization = 'Unknown';
  if (file.name.toLowerCase().includes('q4_k_m')) quantization = 'Q4_K_M (4-bit Balanced)';
  else if (file.name.toLowerCase().includes('q8_0')) quantization = 'Q8_0 (8-bit High Quality)';
  else if (file.name.toLowerCase().includes('q5_k_m')) quantization = 'Q5_K_M (5-bit High)';
  else if (file.name.toLowerCase().includes('q3_k_l')) quantization = 'Q3_K_L (3-bit Budget)';
  else if (file.name.toLowerCase().includes('f16')) quantization = 'F16 (16-bit Full Precision)';
  else if (file.name.toLowerCase().includes('q2_k')) quantization = 'Q2_K (2-bit Low Resource)';
  else {
    // Extract quant properties or look through tags
    const fileQuantMatch = file.name.match(/\b(q[2-8]_[a-z0-9_]+)\b/i);
    if (fileQuantMatch) {
      quantization = fileQuantMatch[1].toUpperCase();
    } else {
      const fileQuantMatch2 = file.name.match(/\b(q[2-8]_k_[s|m|l])\b/i);
      if (fileQuantMatch2) {
        quantization = fileQuantMatch2[1].toUpperCase();
      }
    }
  }

  // Get context length
  const contextLength = Number(props[`${architecture}.context_length`] || props['general.context_length'] || 4096);
  
  // Extrapolate parameter count
  let parameters = 'Lighter Variant (~3B - 8B)';
  const blockCount = props[`${architecture}.block_count`] || props['general.block_count'] || 32;
  const embedLength = props[`${architecture}.embedding_length`] || props['general.embedding_length'] || 4096;
  const ffLength = props[`${architecture}.feed_forward_length`] || props['general.feed_forward_length'] || 11008;

  // Approximate Parameter math
  if (blockCount && embedLength) {
    const calculatedParams = Math.round((blockCount * FFParamsApprox(embedLength, ffLength) * 1.5) / 100000000) / 10;
    if (calculatedParams > 0) {
      parameters = `${calculatedParams}B Parameters`;
    }
  }

  // File size formatter
  const sizeInGB = file.size / (1024 * 1024 * 1024);
  const fileSizeStr = sizeInGB >= 1 
    ? `${sizeInGB.toFixed(2)} GB` 
    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  return {
    name: name.toString(),
    architecture: architecture.toUpperCase(),
    quantization,
    contextLength,
    parameters,
    fileSize: fileSizeStr,
    fileName: file.name
  };
}

function FFParamsApprox(embed: number, ff: number): number {
  return (embed * ff * 3) || (embed * embed * 12);
}
