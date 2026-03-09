
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllMindMaps, MindMapListItem } from '@/utils/mindmapStorage';

interface CatalogEntry {
  mindmap_name: string;
  exam_code: string;
  linked_json_file: string;
}

type CatalogData = Record<string, CatalogEntry[]>;

const formatCategoryName = (cat: string) =>
  cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

const ExamCatalog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [catalog, setCatalog] = useState<CatalogData>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [mindMaps, setMindMaps] = useState<MindMapListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch catalog and saved mindmaps in parallel
        const [catalogRes, maps] = await Promise.all([
          fetch('/api/mindmap-catalog').then(r => r.ok ? r.json() : {}),
          getAllMindMaps(),
        ]);
        const cats = Object.keys(catalogRes);
        setCatalog(catalogRes);
        setCategories(cats);
        if (cats.length > 0) setSelectedCategory(cats[0]);
        setMindMaps(maps);
      } catch (err) {
        console.error('Error loading catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  // Set of saved mindmap names for quick lookup
  const savedNames = new Set(
    mindMaps
      .filter(m => m.examCategory === selectedCategory)
      .map(m => m.name)
  );

  // Exam entries for selected category
  const categoryExams = catalog[selectedCategory] || [];

  // Filter by search
  const filteredExams = categoryExams.filter(exam => {
    if (!searchTerm) return true;
    return exam.mindmap_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (catalog[cat] || []).some(e => e.mindmap_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExamClick = (examName: string) => {
    // If mindmap exists, view it; otherwise go to editor to create
    if (savedNames.has(examName)) {
      navigate(`/view?map=${encodeURIComponent(examName)}`);
    } else {
      navigate(`/editor?exam=${encodeURIComponent(examName)}&category=${encodeURIComponent(selectedCategory)}`);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <Navbar />

      {/* Spacer for fixed navbar */}
      <div className="h-20 sm:h-24" />

      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 2xl:px-8 pb-8">
        {/* Title Row */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl 2xl:text-4xl font-bold text-white">
            Explore Exams
          </h1>
          <Link to="/editor">
              <button className="inline-flex items-center gap-2 text-xs sm:text-sm bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Create New Mind Map</span>
                <span className="sm:hidden">Create Map</span>
              </button>
            </Link>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 h-5 w-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 rounded-lg px-3 pr-10 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-orange-500"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(249,115,22,0.4)' }}
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/50">Loading exam catalog...</div>
        ) : (
        /* Two Panel Layout */
        <div
          className="flex flex-col md:flex-row gap-0 rounded-xl overflow-hidden min-h-[600px] 2xl:min-h-[680px] backdrop-blur-sm"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(249,115,22,0.4)' }}
        >
          {/* Left Panel - Categories */}
          <div className="w-full md:w-64 lg:w-80 2xl:w-96 overflow-y-auto max-h-[300px] md:max-h-none" style={{ borderRight: '1px solid rgba(249,115,22,0.3)' }}>
            {filteredCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left px-3 sm:px-4 2xl:px-5 py-2.5 sm:py-3 2xl:py-3.5 text-sm sm:text-base 2xl:text-[1.05rem] transition-colors ${
                  selectedCategory === category
                    ? 'text-orange-400 font-semibold'
                    : 'text-white/70 hover:text-white'
                }`}
                style={{
                  borderLeft: selectedCategory === category ? '4px solid #f97316' : '4px solid transparent',
                  background: selectedCategory === category ? 'rgba(249,115,22,0.1)' : 'transparent',
                }}
              >
                {formatCategoryName(category)}
                <span className="ml-2 text-xs text-white/30">({(catalog[category] || []).length})</span>
              </button>
            ))}
          </div>

          {/* Right Panel - Exam Names */}
          <div className="flex-1 p-4 sm:p-6 2xl:p-8 overflow-y-auto">
            <h2 className="text-lg sm:text-xl 2xl:text-2xl font-bold text-white mb-4 sm:mb-6">
              {formatCategoryName(selectedCategory)}
              <span className="ml-2 text-sm font-normal text-white/40">
                ({filteredExams.length} exams)
              </span>
            </h2>

            {filteredExams.length > 0 ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 2xl:gap-5">
                {filteredExams.map((exam) => {
                  const hasMindmap = savedNames.has(exam.mindmap_name);
                  return (
                    <button
                      key={exam.mindmap_name}
                      onClick={() => handleExamClick(exam.mindmap_name)}
                      className={`px-3 sm:px-4 2xl:px-5 py-2.5 sm:py-3 2xl:py-3.5 rounded-lg text-left text-xs sm:text-sm 2xl:text-base font-medium transition-all hover:shadow-lg ${
                        hasMindmap ? 'text-green-400' : 'text-white/70 hover:text-white'
                      }`}
                      style={{
                        background: hasMindmap ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                        border: hasMindmap ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {exam.mindmap_name}
                      {hasMindmap && <span className="ml-2 text-xs text-green-500">✓</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-white/50">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-white/30" />
                <p className="text-sm sm:text-base">No exams found in this category.</p>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ExamCatalog;
