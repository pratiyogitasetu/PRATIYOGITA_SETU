
import { FontSize } from '../types';

export const getFontSize = (size: FontSize | undefined): number => {
  switch (size) {
    case 'xs': return 12;
    case 's': return 14;
    case 'm': return 16;
    case 'l': return 20;
    case 'xl': return 24;
    default: return 12;
  }
};

export const getNodeStyle = (nodeType?: string) => {
  switch (nodeType) {
    case 'title':
      return 'bg-[#E5DEFF] rounded-lg shadow-md';
    case 'topic':
      return 'bg-[#FEF7CD] border border-black/20 rounded';
    case 'subtopic':
      return 'bg-[#FDE1D3] border-2 border-black/20 rounded-lg';
    case 'section':
      return 'bg-transparent border-2 border-dashed border-black/40 rounded-lg';
    default:
      return 'bg-white border border-gray-200';
  }
};
