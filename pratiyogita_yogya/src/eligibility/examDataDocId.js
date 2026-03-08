export const buildExamDataDocId = (linkedJsonFile) => {
  if (!linkedJsonFile || typeof linkedJsonFile !== 'string') return '';
  return encodeURIComponent(linkedJsonFile.trim());
};

export default buildExamDataDocId;
