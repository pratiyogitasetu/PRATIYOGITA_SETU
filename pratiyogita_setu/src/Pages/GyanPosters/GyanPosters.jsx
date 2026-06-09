import React, { useState, useCallback } from "react";

// Track reactions per poster: { [file]: "like" | "dislike" | null }
const SUBJECTS = [
  "All",
  "History",
  "Polity",
  "Geography",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Maps",
];

const POSTERS = [
  { file: "/posters/history-mughal-empire.png", subject: "History", title: "Mughal Empire" },
  { file: "/posters/polity-bill.png", subject: "Polity", title: "Bill" },
  { file: "/posters/geography-rivers.png", subject: "Geography", title: "Rivers" },
  { file: "/posters/science-physics.png", subject: "Physics", title: "Physics" },
  { file: "/posters/science-chemistry.png", subject: "Chemistry", title: "Chemistry" },
  { file: "/posters/science-biology.png", subject: "Biology", title: "Biology" },
  { file: "/posters/economics-supply-demand.png", subject: "Economics", title: "Supply & Demand" },
  { file: "/posters/map-nuclear-plants-of-india.png", subject: "Maps", title: "Nuclear Plants of India" },
];

const GyanPosters = () => {
  const [active, setActive] = useState("All");
  const [lightbox, setLightbox] = useState(null);
  const [reactions, setReactions] = useState({}); // { [file]: "like" | "dislike" | null }

  const toggleReaction = useCallback((file, type) => {
    setReactions((prev) => ({
      ...prev,
      [file]: prev[file] === type ? null : type,
    }));
  }, []);

  const filtered =
    active === "All" ? POSTERS : POSTERS.filter((p) => p.subject === active);

  return (
    <div className="pt-20 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#FBF6EE]">
            Gyan Posters
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[#E8D8C3]/80 max-w-2xl mx-auto">
            Beautiful illustration posters covering key concepts across subjects — learn visually, retain longer.
          </p>
        </div>

        {/* Subject Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
          {SUBJECTS.map((subj) => (
            <button
              key={subj}
              onClick={() => setActive(subj)}
              className={`px-4 py-2 rounded-full text-sm sm:text-base font-semibold transition-all duration-200 border ${
                active === subj
                  ? "bg-[#E4572E] text-[#FBF6EE] border-[#E4572E]"
                  : "bg-[#2B1E17]/60 text-[#E8D8C3]/90 border-[#E4572E]/20 hover:bg-[#E4572E]/15 hover:border-[#E4572E]/60 hover:text-[#E4572E]"
              }`}
            >
              {subj}
            </button>
          ))}
        </div>

        {/* Poster Grid — 3 per row */}
        {filtered.length === 0 ? (
          <p className="text-center text-[#E8D8C3]/55 text-lg py-16">
            No posters available for this subject yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filtered.map((poster, idx) => (
              <div
                key={idx}
                onClick={() => setLightbox(poster)}
                className="group cursor-pointer rounded-xl overflow-hidden border border-[#E4572E]/20 bg-[#2B1E17]/55 hover:border-[#E4572E]/65 transition-all duration-300"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={poster.file}
                    alt={poster.title}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 sm:p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-[#FBF6EE] font-bold text-base sm:text-lg">
                      {poster.title}
                    </h3>
                    <span className="text-xs text-[#E4572E] font-medium uppercase tracking-wide">
                      {poster.subject}
                    </span>
                  </div>
                  <span className="text-[#E8D8C3]/35 group-hover:text-[#E4572E] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9m11.25-5.25v4.5m0-4.5h-4.5m4.5 0L15 9m-11.25 11.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25 5.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-[#2B1E17]/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* Close button — fixed top-right */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 bg-[#2B1E17]/80 hover:bg-[#2B1E17] border border-[#E4572E]/40 text-[#FBF6EE] rounded-full p-2.5 z-10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image container — scrollable for tall posters */}
          <div
            className="relative max-w-4xl w-full flex-1 min-h-0 overflow-auto rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.file}
              alt={lightbox.title}
              className="w-full h-auto rounded-xl object-contain"
            />
          </div>

          {/* Bottom bar — title, subject, like/dislike */}
          <div
            className="w-full max-w-4xl mt-3 flex items-center justify-between bg-[#2B1E17]/85 backdrop-blur-md border border-[#E4572E]/25 rounded-xl px-4 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-[#FBF6EE] font-bold text-base sm:text-lg">{lightbox.title}</h3>
              <span className="text-[#E4572E] text-xs sm:text-sm font-medium uppercase tracking-wide">{lightbox.subject}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Download */}
              <a
                href={lightbox.file}
                download={`${lightbox.title} - ${lightbox.subject}.png`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-[#2B1E17]/60 border-[#E4572E]/25 text-[#E8D8C3]/70 hover:border-[#E4572E]/60 hover:text-[#E4572E] transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span className="text-sm font-semibold hidden sm:inline">Download</span>
              </a>
              {/* Like */}
              <button
                onClick={() => toggleReaction(lightbox.file, "like")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  reactions[lightbox.file] === "like"
                    ? "bg-[#E4572E]/20 border-[#E4572E] text-[#E4572E]"
                    : "bg-[#2B1E17]/60 border-[#E4572E]/25 text-[#E8D8C3]/70 hover:border-[#E4572E]/60 hover:text-[#E4572E]"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill={reactions[lightbox.file] === "like" ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                </svg>
                <span className="text-sm font-semibold">Like</span>
              </button>
              {/* Dislike */}
              <button
                onClick={() => toggleReaction(lightbox.file, "dislike")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  reactions[lightbox.file] === "dislike"
                    ? "bg-[#E8D8C3]/20 border-[#E8D8C3] text-[#E8D8C3]"
                    : "bg-[#2B1E17]/60 border-[#E4572E]/25 text-[#E8D8C3]/70 hover:border-[#E8D8C3]/60 hover:text-[#E8D8C3]"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill={reactions[lightbox.file] === "dislike" ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.367 13.75c-.806 0-1.533.446-2.031 1.08a9.041 9.041 0 0 1-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 0 0-.322 1.672v.633a.75.75 0 0 1-.75.75 2.25 2.25 0 0 1-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282m0 0H4.372c-1.026 0-1.945-.694-2.054-1.715A12.137 12.137 0 0 1 2.25 12.25c0-2.847.993-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H10.52c.483 0 .964.078 1.423.23l3.114 1.04a4.501 4.501 0 0 0 1.423.23h1.424m-10.598 9.75H9.75m10.598-9.75a.772.772 0 0 0-.27-.602.797.797 0 0 1 .523-.898h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.958 8.958 0 0 0 1.302-4.665c0-1.194-.232-2.333-.654-3.375Z" />
                </svg>
                <span className="text-sm font-semibold">Dislike</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GyanPosters;
