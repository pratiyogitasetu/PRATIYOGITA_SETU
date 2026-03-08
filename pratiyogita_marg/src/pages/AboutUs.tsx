import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Social {
  type: string;
  url: string;
}

interface TeamMember {
  role: string;
  image: string;
  name: string;
  socials: Social[];
}

const AboutUs = () => {
  const teamMembers: TeamMember[] = [
    {
      role: 'CO-FOUNDER & PRODUCT LEAD',
      image: './Aboutusimages/Abhi.jpg',
      name: 'Abhinav Kumar',
      socials: [
        { type: 'linkedin', url: 'https://www.linkedin.com/in/abhinav-kumar-0ba731239/' },
        { type: 'instagram', url: 'https://instagram.com/' },
        { type: 'facebook', url: 'https://facebook.com/' },
        { type: 'twitter', url: 'https://x.com/ABHINAV11555548' },
      ],
    },
    {
      role: 'CO-FOUNDER & TECHNICAL LEAD',
      image: './Aboutusimages/Manu.jpg',
      name: 'Manu Dev',
      socials: [
        { type: 'linkedin', url: 'https://linkedin.com/' },
        { type: 'github', url: 'https://github.com/' },
        { type: 'instagram', url: 'https://instagram.com/' },
      ],
    },
    {
      role: 'DATA & OPERATIONS LEAD',
      image: './Aboutusimages/Nitish.jpeg',
      name: 'Nitish Yadav',
      socials: [
        { type: 'linkedin', url: 'https://linkedin.com/' },
        { type: 'github', url: 'https://github.com/' },
        { type: 'twitter', url: 'https://twitter.com/' },
      ],
    },
  ];

  const socialIcons: Record<string, string> = {
    linkedin: 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/linkedin.svg',
    github: 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/github.svg',
    instagram: 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/instagram.svg',
    facebook: 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/facebook.svg',
    twitter: 'https://cdn.jsdelivr.net/npm/simple-icons@v6/icons/twitter.svg',
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'CO-FOUNDER & PRODUCT LEAD':
        return { background: 'linear-gradient(45deg, #FF8C00, #FF4500)' };
      case 'CO-FOUNDER & TECHNICAL LEAD':
        return { background: 'linear-gradient(45deg, #4169E1, #1E90FF)' };
      case 'DATA & OPERATIONS LEAD':
        return { background: 'linear-gradient(45deg, #32CD32, #008000)' };
      case 'DESIGNER':
        return { background: 'linear-gradient(45deg, #FF1493, #C71585)' };
      default:
        return { background: 'linear-gradient(45deg, #808080, #A9A9A9)' };
    }
  };

  return (
    <>
      <Navbar />

      {/* CSS for role badge */}
      <style>{`
  .role-badge {
    position: relative;
    overflow: hidden;
    padding: 4px 8px;
    border-radius: 10px;
    color: white;
    font-weight: bold;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`}</style>

<div className="py-12 pb-0 px-4 sm:px-6 lg:px-8 pt-20">
  {/* About Us Section */}
  <div className="w-full max-w-[1280px] mx-auto p-6 sm:p-8 lg:p-10 rounded-[20px] relative overflow-hidden" style={{background: 'rgba(43,30,23,0.6)', border: '1px solid rgba(228,87,46,0.30)'}}>
    {/* Decorative Elements */}
    <div className="absolute top-0 left-0 w-20 h-20 rounded-full opacity-20 -translate-x-1/3 -translate-y-1/3" style={{background: 'rgba(228,87,46,0.3)'}}></div>
    <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-20 translate-x-1/3 translate-y-1/3" style={{background: 'rgba(232,216,195,0.2)'}}></div>

    {/* Heading with Underline */}
    <div className="relative">
      <h2 className="text-center text-[#FBF6EE] text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
        About Us
      </h2>
      <div className="h-1 w-20 bg-[#E4572E] mx-auto mt-3 rounded-full"></div>
    </div>

    {/* Content Wrapper */}
    <div className="mt-2 flex flex-col items-center gap-8 relative">
      <div className="w-full p-6 rounded-lg border-l-4 border-[#E4572E] text-[#E8D8C3] text-base sm:text-lg leading-relaxed" style={{background: 'rgba(43,30,23,0.5)'}}>
        <p className="mb-4 italic">
          We are <span className="font-semibold text-[#E4572E]">Abhinav Kumar</span>, <span className="font-semibold text-[#E4572E]">Manu Dev</span>, and <span className="font-semibold text-[#E4572E]">Nitish Yadav</span>, and we created <span className="font-semibold text-[#FBF6EE]">Pratiyogita Setu</span> with a simple purpose -
          to bring clarity, direction, and confidence to students preparing for competitive examinations.
        </p>
        <p className="mb-4">
          Every year in India, millions of aspirants prepare for thousands of government and competitive exams.
          But despite the effort they put in, many students struggle with one basic problem:
          they don't clearly know where they stand or what their best path forward is.
        </p>
        <p className="mb-4">
          Some miss opportunities because they are unaware of their eligibility.
          Others spend years preparing for exams they may never qualify for.
          And many feel lost in a system filled with scattered information and uncertainty.
        </p>
        <p className="mb-4 font-semibold text-[#FBF6EE]">Pratiyogita Setu was built to change that.</p>
        <p className="mb-4">
          We believe that the first step toward success is clear and reliable guidance.
          Our platform helps aspirants understand their real eligibility, plan their preparation with structure,
          and move forward with confidence instead of confusion.
        </p>
        <p className="mb-4">
          Through intelligent analysis, structured roadmaps, and trustworthy learning support,
          we aim to make sure that no genuine effort goes in the wrong direction
          and every student gets a fair chance to reach their goal.
        </p>
        <p className="mb-4">
          This is not just a project for us,
          it is a commitment to support students in one of the most important journeys of their lives.
        </p>
      </div>
    </div>
  </div>

        {/* Meet The Team Section */}
        <div className="w-full max-w-[1280px] mx-auto p-4 sm:p-8 lg:p-6 mt-1">
          {/* Heading */}
          <h2 className="text-center text-[#FBF6EE] text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            Meet the Team
          </h2>

          {/* Team Members Grid */}
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member, index) => (
              <div key={index} className="p-6 flex flex-col items-center text-center">
                {/* Role Badge */}
                <div
                  className="role-badge"
                  style={getRoleBadgeStyle(member.role)}
                >
                  {member.role}
                </div>

                {/* Profile Picture */}
                <div className="w-[200px] h-[250px] rounded-[20px] overflow-hidden flex items-center justify-center" style={{background: 'rgba(43,30,23,0.5)', border: '1px solid rgba(228,87,46,0.20)'}}>
                  <img
                    src={member.image}
                    alt={member.role}
                    className="w-full h-full object-cover rounded-[20px]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).onerror = null;
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200';
                    }}
                  />
                </div>

                {/* Member Name */}
                <h3 className="text-[#E8D8C3] text-s sm:text-1xl font-bold leading-7 mt-3">
                  {member.name}
                </h3>

                {/* Social Media Icons */}
                <div className="flex justify-center items-center flex-wrap gap-2 mt-4">
                  {member.socials.map((social, i) => (
                    <a
                      key={i}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-10 rounded-full flex items-center justify-center hover:bg-[#E4572E]/20 transition-colors"
                      style={{background: 'rgba(43,30,23,0.5)'}}
                    >
                      <img
                        src={socialIcons[social.type]}
                        alt={social.type}
                        className="w-5 h-5 invert"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default AboutUs;
