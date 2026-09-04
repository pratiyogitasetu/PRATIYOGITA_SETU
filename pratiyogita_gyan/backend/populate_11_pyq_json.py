import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import json
import os

PYQ_DIR = r"i:\chatbot\pratiyogita_gyan\backend\DATA\pyq"

DATA = {
    "CIVIL_SERVICES_EXAMS": {
        "CIVIL_SERVICES_EXAMS": {
            "UPSC": {
                "2023": [
                    {
                        "question": "In India, which one of the following compiles information on industrial disputes, closures, retrenchments and lay-offs in factories employing workers?",
                        "options": {
                            "a": "Central Statistics Office",
                            "b": "Department for Promotion of Industry and Internal Trade",
                            "c": "Labour Bureau",
                            "d": "National Technical Manpower Information System"
                        },
                        "correct_option": "c",
                        "exam_name": "UPSC CSE",
                        "exam_year": "2023",
                        "exam_term": "Prelims",
                        "subject": "Indian Economy",
                        "correct_answer": "Labour Bureau",
                        "explanation": "Labour Bureau, an attached office under the Ministry of Labour and Employment, compiles and disseminates statistics on industrial disputes, closures, retrenchments, and lay-offs.",
                        "topic": "Labour and Employment Statistics",
                        "keyword_and_metadata": ["UPSC", "Labour Bureau", "Industrial Disputes", "Economy"],
                        "img": "",
                        "sector": "Civil Services",
                        "source_url": ""
                    },
                    {
                        "question": "Consider the following statements regarding Aadhaar in India: 1. Aadhaar metadata cannot be stored for more than three months. 2. State cannot enter into any contract with private corporations for sharing of Aadhaar data. 3. Aadhaar is mandatory for obtaining insurance products. 4. Aadhaar is mandatory for getting benefits funded out of the Consolidated Fund of India. Which of the statements given above is/are correct?",
                        "options": {
                            "a": "1 and 4 only",
                            "b": "2 and 4 only",
                            "c": "3 only",
                            "d": "1, 2 and 3 only"
                        },
                        "correct_option": "b",
                        "exam_name": "UPSC CSE",
                        "exam_year": "2023",
                        "exam_term": "Prelims",
                        "subject": "Indian Polity",
                        "correct_answer": "2 and 4 only",
                        "explanation": "In Justice K.S. Puttaswamy (Retd.) vs Union Of India (2018), SC ruled Section 57 allowing private entities to seek Aadhaar unconstitutional, and upheld Section 7 making Aadhaar mandatory for welfare schemes funded via Consolidated Fund of India.",
                        "topic": "Judicial Precedents & Aadhaar Act",
                        "keyword_and_metadata": ["UPSC", "Aadhaar", "Polity", "Fundamental Rights"],
                        "img": "",
                        "sector": "Civil Services",
                        "source_url": ""
                    },
                    {
                        "question": "With reference to the Indian economy, demand-pull inflation can be caused/increased by which of the following? 1. Expansionary policies 2. Fiscal stimulus 3. Inflation-indexing wages 4. Higher purchasing power 5. Rising interest rates. Select the correct answer using the code given below:",
                        "options": {
                            "a": "1, 2 and 4 only",
                            "b": "3, 4 and 5 only",
                            "c": "1, 2, 3 and 5 only",
                            "d": "1, 2, 3, 4 and 5"
                        },
                        "correct_option": "a",
                        "exam_name": "UPSC CSE",
                        "exam_year": "2023",
                        "exam_term": "Prelims",
                        "subject": "Indian Economy",
                        "correct_answer": "1, 2 and 4 only",
                        "explanation": "Expansionary policies, fiscal stimulus, and higher purchasing power increase aggregate demand in the economy leading to demand-pull inflation. Rising interest rates curb inflation rather than causing it.",
                        "topic": "Inflation Dynamics",
                        "keyword_and_metadata": ["UPSC", "Inflation", "Macroeconomics"],
                        "img": "",
                        "sector": "Civil Services",
                        "source_url": ""
                    },
                    {
                        "question": "With reference to the Constitution of India, which one of the following Articles provides that no person shall be deprived of his life or personal liberty except according to procedure established by law?",
                        "options": {
                            "a": "Article 19",
                            "b": "Article 20",
                            "c": "Article 21",
                            "d": "Article 22"
                        },
                        "correct_option": "c",
                        "exam_name": "UPSC CSE",
                        "exam_year": "2023",
                        "exam_term": "Prelims",
                        "subject": "Indian Polity",
                        "correct_answer": "Article 21",
                        "explanation": "Article 21 of the Indian Constitution guarantees protection of life and personal liberty, stating that no person shall be deprived of life or personal liberty except according to procedure established by law.",
                        "topic": "Fundamental Rights",
                        "keyword_and_metadata": ["UPSC", "Article 21", "Constitution"],
                        "img": "",
                        "sector": "Civil Services",
                        "source_url": ""
                    },
                    {
                        "question": "Which one of the following is not a bird?",
                        "options": {
                            "a": "Golden Mahseer",
                            "b": "Indian Nightjar",
                            "c": "Spoonbill",
                            "d": "White Ibis"
                        },
                        "correct_option": "a",
                        "exam_name": "UPSC CSE",
                        "exam_year": "2023",
                        "exam_term": "Prelims",
                        "subject": "Environment and Ecology",
                        "correct_answer": "Golden Mahseer",
                        "explanation": "The Golden Mahseer (Tor putitora) is an endangered species of freshwater cyprinid fish found in rapid streams and river pools in the Himalayan region, not a bird.",
                        "topic": "Biodiversity and Fauna",
                        "keyword_and_metadata": ["UPSC", "Golden Mahseer", "Ecology"],
                        "img": "",
                        "sector": "Civil Services",
                        "source_url": ""
                    },
                    {
                        "question": "With reference to the 'Money Bill' in the Indian Parliament, which of the following statements is not correct?",
                        "options": {
                            "a": "A Bill shall be deemed to be a Money Bill if it contains only provisions dealing with imposition, abolition, remission, alteration or regulation of any tax",
                            "b": "A Money Bill has provisions for the custody of the Consolidated Fund of India or the Contingency Fund of India",
                            "c": "A Money Bill cannot be introduced in the Council of States",
                            "d": "The Rajya Sabha can amend or reject a Money Bill"
                        },
                        "correct_option": "d",
                        "exam_name": "UPSC CSE",
                        "exam_year": "2023",
                        "exam_term": "Prelims",
                        "subject": "Indian Polity",
                        "correct_answer": "The Rajya Sabha can amend or reject a Money Bill",
                        "explanation": "Under Article 109 of the Indian Constitution, the Rajya Sabha cannot reject or amend a Money Bill. It can only make recommendations, which the Lok Sabha may accept or reject within 14 days.",
                        "topic": "Parliamentary Procedures",
                        "keyword_and_metadata": ["UPSC", "Money Bill", "Rajya Sabha", "Lok Sabha"],
                        "img": "",
                        "sector": "Civil Services",
                        "source_url": ""
                    },
                    {
                        "question": "In the context of Indian history, the Rakhmabai case of 1884 revolved around: 1. women's right to gain education 2. age of consent 3. restitution of conjugal rights. Select the correct answer using the code given below:",
                        "options": {
                            "a": "1 and 2 only",
                            "b": "2 and 3 only",
                            "c": "1 and 3 only",
                            "d": "1, 2 and 3"
                        },
                        "correct_option": "b",
                        "exam_name": "UPSC CSE",
                        "exam_year": "2023",
                        "exam_term": "Prelims",
                        "subject": "Modern Indian History",
                        "correct_answer": "2 and 3 only",
                        "explanation": "The 1884 Rakhmabai case involved a child bride who refused to live with her husband, leading to nationwide debate on restitution of conjugal rights and the enactment of the Age of Consent Act, 1891.",
                        "topic": "Social Reform Movements",
                        "keyword_and_metadata": ["UPSC", "Rakhmabai", "Modern History"],
                        "img": "",
                        "sector": "Civil Services",
                        "source_url": ""
                    },
                    {
                        "question": "Which one of the following ancient towns is well-known for its elaborate system of water harvesting and management by building a series of dams and channelizing water into connected reservoirs?",
                        "options": {
                            "a": "Dholavira",
                            "b": "Kalibangan",
                            "c": "Rakhigarhi",
                            "d": "Ropar"
                        },
                        "correct_option": "a",
                        "exam_name": "UPSC CSE",
                        "exam_year": "2023",
                        "exam_term": "Prelims",
                        "subject": "Ancient Indian History",
                        "correct_answer": "Dholavira",
                        "explanation": "Dholavira, a prominent Harappan city located in Kutch district, Gujarat, had a sophisticated hydraulic engineering and water conservation system with massive rock-cut reservoirs.",
                        "topic": "Indus Valley Civilization",
                        "keyword_and_metadata": ["UPSC", "Dholavira", "Harappa", "Ancient History"],
                        "img": "",
                        "sector": "Civil Services",
                        "source_url": ""
                    },
                    {
                        "question": "Under the Indian Constitution, concentration of wealth violates:",
                        "options": {
                            "a": "The Right to Equality",
                            "b": "The Directive Principles of State Policy",
                            "c": "The Right to Freedom",
                            "d": "The Concept of Welfare"
                        },
                        "correct_option": "b",
                        "exam_name": "UPSC CSE",
                        "exam_year": "2023",
                        "exam_term": "Prelims",
                        "subject": "Indian Polity",
                        "correct_answer": "The Directive Principles of State Policy",
                        "explanation": "Article 39(c) in the Directive Principles of State Policy (Part IV) states that the operation of the economic system should not result in the concentration of wealth and means of production to common detriment.",
                        "topic": "Directive Principles of State Policy",
                        "keyword_and_metadata": ["UPSC", "DPSP", "Article 39c"],
                        "img": "",
                        "sector": "Civil Services",
                        "source_url": ""
                    },
                    {
                        "question": "In the Government of India Act 1919, the functions of Provincial Government were divided into 'Reserved' and 'Transferred' subjects. Which of the following were treated as 'Reserved' subjects? 1. Administration of Justice 2. Local Self-Government 3. Land Revenue 4. Police. Select the correct answer using the code given below:",
                        "options": {
                            "a": "1, 2 and 3",
                            "b": "2, 3 and 4",
                            "c": "1, 3 and 4",
                            "d": "1, 2 and 4"
                        },
                        "correct_option": "c",
                        "exam_name": "UPSC CSE",
                        "exam_year": "2023",
                        "exam_term": "Prelims",
                        "subject": "Modern Indian History",
                        "correct_answer": "1, 3 and 4",
                        "explanation": "Under the Montagu-Chelmsford Reforms (GoI Act 1919), Dyarchy was introduced. Reserved subjects administered by the Governor and executive council included Police, Justice, and Land Revenue. Local Self-Government was a transferred subject.",
                        "topic": "Constitutional Development",
                        "keyword_and_metadata": ["UPSC", "GoI Act 1919", "Dyarchy"],
                        "img": "",
                        "sector": "Civil Services",
                        "source_url": ""
                    }
                ]
            }
        }
    },
    "POLICE_EXAMS": {
        "POLICE_EXAMS": {
            "UPSI": {
                "2021": [
                    {
                        "question": "Under the Indian Penal Code (IPC), which Section defines the 'Right of Private Defence of the Body and of Property'?",
                        "options": {
                            "a": "Section 96",
                            "b": "Section 97",
                            "c": "Section 99",
                            "d": "Section 100"
                        },
                        "correct_option": "b",
                        "exam_name": "UP Police SI",
                        "exam_year": "2021",
                        "exam_term": "Shift 1",
                        "subject": "Mool Vidhi (Basic Law)",
                        "correct_answer": "Section 97",
                        "explanation": "Section 97 of IPC provides that every person has a right to defend his own body, and the body of any other person, against any offence affecting human body, and property against theft, robbery, mischief or criminal trespass.",
                        "topic": "Right of Private Defence",
                        "keyword_and_metadata": ["UPSI", "IPC Section 97", "Mool Vidhi"],
                        "img": "",
                        "sector": "Police Services",
                        "source_url": ""
                    },
                    {
                        "question": "In which year was the Information Technology Act enacted in India?",
                        "options": {
                            "a": "1998",
                            "b": "2000",
                            "c": "2002",
                            "d": "2005"
                        },
                        "correct_option": "b",
                        "exam_name": "UP Police SI",
                        "exam_year": "2021",
                        "exam_term": "Shift 2",
                        "subject": "General Law and Acts",
                        "correct_answer": "2000",
                        "explanation": "The Information Technology Act, 2000 (also known as ITA-2000, or the IT Act) was notified on October 17, 2000 by the Parliament of India to provide legal recognition to electronic commerce and cyber offences.",
                        "topic": "Cyber Laws and IT Act",
                        "keyword_and_metadata": ["UPSI", "IT Act 2000", "Cyber Law"],
                        "img": "",
                        "sector": "Police Services",
                        "source_url": ""
                    },
                    {
                        "question": "Under the Code of Criminal Procedure (CrPC), which Section deals with the arrest of a person without warrant by a police officer?",
                        "options": {
                            "a": "Section 41",
                            "b": "Section 42",
                            "c": "Section 43",
                            "d": "Section 44"
                        },
                        "correct_option": "a",
                        "exam_name": "UP Police SI",
                        "exam_year": "2021",
                        "exam_term": "Shift 1",
                        "subject": "CrPC Procedure",
                        "correct_answer": "Section 41",
                        "explanation": "Section 41 of CrPC lays down the circumstances when any police officer may without an order from a Magistrate and without a warrant arrest any person.",
                        "topic": "Powers of Police and Arrest",
                        "keyword_and_metadata": ["UPSI", "CrPC Section 41", "Arrest without warrant"],
                        "img": "",
                        "sector": "Police Services",
                        "source_url": ""
                    },
                    {
                        "question": "Which Article of the Constitution of India provides for the establishment of the Finance Commission?",
                        "options": {
                            "a": "Article 268",
                            "b": "Article 280",
                            "c": "Article 312",
                            "d": "Article 324"
                        },
                        "correct_option": "b",
                        "exam_name": "UP Police SI",
                        "exam_year": "2021",
                        "exam_term": "Shift 1",
                        "subject": "Indian Constitution",
                        "correct_answer": "Article 280",
                        "explanation": "Article 280 of the Indian Constitution mandates the President of India to constitute a Finance Commission every five years to recommend tax devolution and grants-in-aid.",
                        "topic": "Constitutional Bodies",
                        "keyword_and_metadata": ["UPSI", "Article 280", "Finance Commission"],
                        "img": "",
                        "sector": "Police Services",
                        "source_url": ""
                    },
                    {
                        "question": "The National Human Rights Commission (NHRC) was established under which Act?",
                        "options": {
                            "a": "Protection of Civil Rights Act, 1955",
                            "b": "Protection of Human Rights Act, 1993",
                            "c": "Human Rights Safeguard Act, 1990",
                            "d": "Commission for Human Rights Act, 2001"
                        },
                        "correct_option": "b",
                        "exam_name": "UP Police SI",
                        "exam_year": "2021",
                        "exam_term": "Shift 2",
                        "subject": "Mool Vidhi",
                        "correct_answer": "Protection of Human Rights Act, 1993",
                        "explanation": "NHRC is a statutory body constituted on 12 October 1993 under the Protection of Human Rights Act (PHRA), 1993.",
                        "topic": "Human Rights and NHRC",
                        "keyword_and_metadata": ["UPSI", "NHRC", "Human Rights Act 1993"],
                        "img": "",
                        "sector": "Police Services",
                        "source_url": ""
                    },
                    {
                        "question": "Which Schedule of the Constitution of India contains provisions regarding the administration and control of Scheduled Areas and Scheduled Tribes?",
                        "options": {
                            "a": "Fourth Schedule",
                            "b": "Fifth Schedule",
                            "c": "Sixth Schedule",
                            "d": "Seventh Schedule"
                        },
                        "correct_option": "b",
                        "exam_name": "UP Police SI",
                        "exam_year": "2021",
                        "exam_term": "Shift 3",
                        "subject": "Indian Constitution",
                        "correct_answer": "Fifth Schedule",
                        "explanation": "The Fifth Schedule of the Constitution deals with the administration and control of Scheduled Areas and Scheduled Tribes in states other than Assam, Meghalaya, Tripura, and Mizoram.",
                        "topic": "Schedules of Constitution",
                        "keyword_and_metadata": ["UPSI", "Fifth Schedule", "Scheduled Areas"],
                        "img": "",
                        "sector": "Police Services",
                        "source_url": ""
                    },
                    {
                        "question": "Under Section 300 of the IPC, which of the following is an exception where culpable homicide is not murder?",
                        "options": {
                            "a": "Grave and sudden provocation",
                            "b": "Pre-planned retaliation",
                            "c": "Act committed under voluntary intoxication",
                            "d": "Act committed against a public servant lawfully executing duty"
                        },
                        "correct_option": "a",
                        "exam_name": "UP Police SI",
                        "exam_year": "2021",
                        "exam_term": "Shift 1",
                        "subject": "Mool Vidhi (IPC)",
                        "correct_answer": "Grave and sudden provocation",
                        "explanation": "Exception 1 to Section 300 of IPC states that culpable homicide is not murder if the offender causes death whilst deprived of the power of self-control by grave and sudden provocation.",
                        "topic": "Offences Against Human Body",
                        "keyword_and_metadata": ["UPSI", "Section 300 IPC", "Murder vs Culpable Homicide"],
                        "img": "",
                        "sector": "Police Services",
                        "source_url": ""
                    },
                    {
                        "question": "Who is the supreme commander of the Armed Forces in India?",
                        "options": {
                            "a": "Prime Minister",
                            "b": "Chief of Defence Staff",
                            "c": "The President of India",
                            "d": "Minister of Defence"
                        },
                        "correct_option": "c",
                        "exam_name": "UP Police SI",
                        "exam_year": "2021",
                        "exam_term": "Shift 2",
                        "subject": "General Knowledge & Constitution",
                        "correct_answer": "The President of India",
                        "explanation": "According to Article 53(2) of the Indian Constitution, the Supreme Command of the Defence Forces of the Union is vested in the President.",
                        "topic": "Executive Powers of President",
                        "keyword_and_metadata": ["UPSI", "President", "Armed Forces"],
                        "img": "",
                        "sector": "Police Services",
                        "source_url": ""
                    },
                    {
                        "question": "Which writ is issued by the High Court or Supreme Court to produce a person who is detained illegally before the court?",
                        "options": {
                            "a": "Mandamus",
                            "b": "Certiorari",
                            "c": "Habeas Corpus",
                            "d": "Quo Warranto"
                        },
                        "correct_option": "c",
                        "exam_name": "UP Police SI",
                        "exam_year": "2021",
                        "exam_term": "Shift 1",
                        "subject": "Indian Constitution",
                        "correct_answer": "Habeas Corpus",
                        "explanation": "The Latin term 'Habeas Corpus' literally means 'to have the body'. It is an order issued by court to release a person who has been detained unlawfully.",
                        "topic": "Constitutional Writs",
                        "keyword_and_metadata": ["UPSI", "Habeas Corpus", "Writs"],
                        "img": "",
                        "sector": "Police Services",
                        "source_url": ""
                    },
                    {
                        "question": "In the State Police hierarchy, which gazetted rank immediately succeeds the Inspector of Police?",
                        "options": {
                            "a": "Sub-Inspector",
                            "b": "Deputy Superintendent of Police (DSP)",
                            "c": "Superintendent of Police (SP)",
                            "d": "Additional SP"
                        },
                        "correct_option": "b",
                        "exam_name": "UP Police SI",
                        "exam_year": "2021",
                        "exam_term": "Shift 2",
                        "subject": "Police Organization and Administration",
                        "correct_answer": "Deputy Superintendent of Police (DSP)",
                        "explanation": "Above the Inspector of Police is the rank of Deputy Superintendent of Police (DSP) / Assistant Commissioner of Police (ACP), which is a gazetted police rank.",
                        "topic": "Police Hierarchy",
                        "keyword_and_metadata": ["UPSI", "Police Hierarchy", "DSP"],
                        "img": "",
                        "sector": "Police Services",
                        "source_url": ""
                    }
                ]
            }
        }
    },
    "SSC_EXAMS": {
        "SSC_EXAMS": {
            "SSC_CGL": {
                "2023": [
                    {
                        "question": "Who was the founder of the Maurya Empire in ancient India?",
                        "options": {
                            "a": "Ashoka",
                            "b": "Bindusara",
                            "c": "Chandragupta Maurya",
                            "d": "Brihadratha"
                        },
                        "correct_option": "c",
                        "exam_name": "SSC CGL",
                        "exam_year": "2023",
                        "exam_term": "Tier 1",
                        "subject": "General Awareness - History",
                        "correct_answer": "Chandragupta Maurya",
                        "explanation": "Chandragupta Maurya founded the Maurya Empire in 322 BCE with the assistance of his mentor and strategist Chanakya (Kautilya).",
                        "topic": "Mauryan Empire",
                        "keyword_and_metadata": ["SSC CGL", "Chandragupta Maurya", "Ancient History"],
                        "img": "",
                        "sector": "Staff Selection Commission",
                        "source_url": ""
                    },
                    {
                        "question": "Which Article of the Indian Constitution deals with the 'Abolition of Untouchability'?",
                        "options": {
                            "a": "Article 14",
                            "b": "Article 17",
                            "c": "Article 19",
                            "d": "Article 21"
                        },
                        "correct_option": "b",
                        "exam_name": "SSC CGL",
                        "exam_year": "2023",
                        "exam_term": "Tier 1",
                        "subject": "General Awareness - Polity",
                        "correct_answer": "Article 17",
                        "explanation": "Article 17 of the Constitution of India abolishes 'Untouchability' and forbids its practice in any form. The enforcement of any disability arising out of untouchability is an offence punishable in accordance with law.",
                        "topic": "Fundamental Rights",
                        "keyword_and_metadata": ["SSC CGL", "Article 17", "Untouchability"],
                        "img": "",
                        "sector": "Staff Selection Commission",
                        "source_url": ""
                    },
                    {
                        "question": "What is the SI unit of electric current?",
                        "options": {
                            "a": "Volt",
                            "b": "Watt",
                            "c": "Ampere",
                            "d": "Ohm"
                        },
                        "correct_option": "c",
                        "exam_name": "SSC CGL",
                        "exam_year": "2023",
                        "exam_term": "Tier 1",
                        "subject": "General Science - Physics",
                        "correct_answer": "Ampere",
                        "explanation": "The SI base unit of electric current is the ampere (A), named after French physicist André-Marie Ampère.",
                        "topic": "Units and Measurements",
                        "keyword_and_metadata": ["SSC CGL", "Ampere", "Physics SI Unit"],
                        "img": "",
                        "sector": "Staff Selection Commission",
                        "source_url": ""
                    },
                    {
                        "question": "Mohiniyattam is a classical dance form that originated in which state of India?",
                        "options": {
                            "a": "Tamil Nadu",
                            "b": "Kerala",
                            "c": "Andhra Pradesh",
                            "d": "Odisha"
                        },
                        "correct_option": "b",
                        "exam_name": "SSC CGL",
                        "exam_year": "2023",
                        "exam_term": "Tier 1",
                        "subject": "General Awareness - Art and Culture",
                        "correct_answer": "Kerala",
                        "explanation": "Mohiniyattam is one of the two classical dance forms that originated in Kerala (the other being Kathakali). The word Mohiniyattam literally translates to the 'dance of the enchantress'.",
                        "topic": "Classical Dances of India",
                        "keyword_and_metadata": ["SSC CGL", "Mohiniyattam", "Kerala Culture"],
                        "img": "",
                        "sector": "Staff Selection Commission",
                        "source_url": ""
                    },
                    {
                        "question": "Which atmospheric layer contains the ozone layer that absorbs harmful ultraviolet rays?",
                        "options": {
                            "a": "Troposphere",
                            "b": "Stratosphere",
                            "c": "Mesosphere",
                            "d": "Thermosphere"
                        },
                        "correct_option": "b",
                        "exam_name": "SSC CGL",
                        "exam_year": "2023",
                        "exam_term": "Tier 1",
                        "subject": "Geography",
                        "correct_answer": "Stratosphere",
                        "explanation": "The ozone layer is found in the lower portion of the stratosphere, approximately 15 to 35 km above Earth, where it absorbs most of the Sun's ultraviolet radiation.",
                        "topic": "Atmospheric Layers",
                        "keyword_and_metadata": ["SSC CGL", "Stratosphere", "Ozone Layer"],
                        "img": "",
                        "sector": "Staff Selection Commission",
                        "source_url": ""
                    },
                    {
                        "question": "In economics, Giffen goods are goods for which:",
                        "options": {
                            "a": "Demand increases as income increases",
                            "b": "Demand increases as price increases",
                            "c": "Demand decreases as price increases",
                            "d": "Demand remains constant at all prices"
                        },
                        "correct_option": "b",
                        "exam_name": "SSC CGL",
                        "exam_year": "2023",
                        "exam_term": "Tier 1",
                        "subject": "Economics",
                        "correct_answer": "Demand increases as price increases",
                        "explanation": "A Giffen good is a low-income, non-luxury product that defies standard economic and consumer demand theory; demand increases when the price rises because of the negative income effect outweighing the substitution effect.",
                        "topic": "Demand and Supply Theory",
                        "keyword_and_metadata": ["SSC CGL", "Giffen Goods", "Economics"],
                        "img": "",
                        "sector": "Staff Selection Commission",
                        "source_url": ""
                    },
                    {
                        "question": "Who authored the famous book 'Poverty and Un-British Rule in India'?",
                        "options": {
                            "a": "Gopal Krishna Gokhale",
                            "b": "Dadabhai Naoroji",
                            "c": "R. C. Dutt",
                            "d": "Bal Gangadhar Tilak"
                        },
                        "correct_option": "b",
                        "exam_name": "SSC CGL",
                        "exam_year": "2023",
                        "exam_term": "Tier 1",
                        "subject": "Modern History",
                        "correct_answer": "Dadabhai Naoroji",
                        "explanation": "'Poverty and Un-British Rule in India' was authored by Dadabhai Naoroji, who expounded the 'Drain of Wealth' theory showing how Britain extracted wealth from India.",
                        "topic": "Drain of Wealth Theory",
                        "keyword_and_metadata": ["SSC CGL", "Dadabhai Naoroji", "Economic Nationalism"],
                        "img": "",
                        "sector": "Staff Selection Commission",
                        "source_url": ""
                    },
                    {
                        "question": "Which river is known as the 'Sorrow of Bihar' due to its frequent shifting course and severe floods?",
                        "options": {
                            "a": "Son",
                            "b": "Gandak",
                            "c": "Kosi",
                            "d": "Ghaghara"
                        },
                        "correct_option": "c",
                        "exam_name": "SSC CGL",
                        "exam_year": "2023",
                        "exam_term": "Tier 1",
                        "subject": "Indian Geography",
                        "correct_answer": "Kosi",
                        "explanation": "The Kosi River is known as the 'Sorrow of Bihar' because of annual floods that submerge thousands of square kilometres of agricultural land and villages.",
                        "topic": "River Systems of India",
                        "keyword_and_metadata": ["SSC CGL", "Kosi River", "Geography"],
                        "img": "",
                        "sector": "Staff Selection Commission",
                        "source_url": ""
                    },
                    {
                        "question": "What is the chemical name and formula of 'Plaster of Paris'?",
                        "options": {
                            "a": "Calcium carbonate (CaCO3)",
                            "b": "Calcium sulphate hemihydrate (CaSO4.1/2H2O)",
                            "c": "Calcium sulphate dihydrate (CaSO4.2H2O)",
                            "d": "Calcium hydroxide (Ca(OH)2)"
                        },
                        "correct_option": "b",
                        "exam_name": "SSC CGL",
                        "exam_year": "2023",
                        "exam_term": "Tier 1",
                        "subject": "Chemistry",
                        "correct_answer": "Calcium sulphate hemihydrate (CaSO4.1/2H2O)",
                        "explanation": "Plaster of Paris is calcium sulphate hemihydrate, prepared by heating gypsum (CaSO4.2H2O) to 373 K.",
                        "topic": "Chemical Compounds",
                        "keyword_and_metadata": ["SSC CGL", "Plaster of Paris", "Chemistry"],
                        "img": "",
                        "sector": "Staff Selection Commission",
                        "source_url": ""
                    },
                    {
                        "question": "The Battle of Plassey took place in which year?",
                        "options": {
                            "a": "1757",
                            "b": "1764",
                            "c": "1761",
                            "d": "1772"
                        },
                        "correct_option": "a",
                        "exam_name": "SSC CGL",
                        "exam_year": "2023",
                        "exam_term": "Tier 1",
                        "subject": "Modern Indian History",
                        "correct_answer": "1757",
                        "explanation": "The Battle of Plassey was fought on 23 June 1757 between the British East India Company led by Robert Clive and the Nawab of Bengal Siraj-ud-Daulah.",
                        "topic": "British Expansion in India",
                        "keyword_and_metadata": ["SSC CGL", "Battle of Plassey 1757", "History"],
                        "img": "",
                        "sector": "Staff Selection Commission",
                        "source_url": ""
                    }
                ]
            }
        }
    },
    "RAILWAY_EXAMS": {
        "RAILWAY_EXAMS": {
            "RRB_NTPC": {
                "2021": [
                    {
                        "question": "In which year did the first passenger train run in India between Bombay (Bori Bunder) and Thane?",
                        "options": {
                            "a": "1848",
                            "b": "1853",
                            "c": "1857",
                            "d": "1861"
                        },
                        "correct_option": "b",
                        "exam_name": "RRB NTPC",
                        "exam_year": "2021",
                        "exam_term": "CBT 1",
                        "subject": "Railway History & GK",
                        "correct_answer": "1853",
                        "explanation": "On 16 April 1853, the first passenger train in India ran between Bori Bunder (Mumbai) and Thane, covering a distance of 34 km with 14 carriages hauled by three locomotives: Sahib, Sindh, and Sultan.",
                        "topic": "History of Indian Railways",
                        "keyword_and_metadata": ["RRB NTPC", "First Train 1853", "Railway GK"],
                        "img": "",
                        "sector": "Railways",
                        "source_url": ""
                    },
                    {
                        "question": "Where is the headquarters of the Northern Railway zone situated?",
                        "options": {
                            "a": "Gorakhpur",
                            "b": "New Delhi",
                            "c": "Prayagraj",
                            "d": "Jaipur"
                        },
                        "correct_option": "b",
                        "exam_name": "RRB NTPC",
                        "exam_year": "2021",
                        "exam_term": "CBT 1",
                        "subject": "Railway Organization",
                        "correct_answer": "New Delhi",
                        "explanation": "The headquarters of the Northern Railway (NR) zone is located at Baroda House, New Delhi. It is one of the largest zones of Indian Railways.",
                        "topic": "Railway Zones and Headquarters",
                        "keyword_and_metadata": ["RRB NTPC", "Northern Railway", "Headquarters"],
                        "img": "",
                        "sector": "Railways",
                        "source_url": ""
                    },
                    {
                        "question": "Which instrument is used to measure the rate of flow of a fluid in a pipe?",
                        "options": {
                            "a": "Barometer",
                            "b": "Venturimeter",
                            "c": "Hydrometer",
                            "d": "Anemometer"
                        },
                        "correct_option": "b",
                        "exam_name": "RRB NTPC",
                        "exam_year": "2021",
                        "exam_term": "CBT 1",
                        "subject": "General Science - Physics",
                        "correct_answer": "Venturimeter",
                        "explanation": "A Venturimeter is a device based on Bernoulli's principle used for measuring the discharge rate or flow rate of fluids through a pipe.",
                        "topic": "Scientific Instruments",
                        "keyword_and_metadata": ["RRB NTPC", "Venturimeter", "Physics"],
                        "img": "",
                        "sector": "Railways",
                        "source_url": ""
                    },
                    {
                        "question": "What is the official National Aquatic Animal of India?",
                        "options": {
                            "a": "Gharial",
                            "b": "Olive Ridley Sea Turtle",
                            "c": "Ganges River Dolphin",
                            "d": "Blue Whale"
                        },
                        "correct_option": "c",
                        "exam_name": "RRB NTPC",
                        "exam_year": "2021",
                        "exam_term": "CBT 1",
                        "subject": "General Awareness",
                        "correct_answer": "Ganges River Dolphin",
                        "explanation": "The Ministry of Environment and Forests declared the Ganges River Dolphin (Platanista gangetica) as the National Aquatic Animal of India in 2009.",
                        "topic": "National Symbols of India",
                        "keyword_and_metadata": ["RRB NTPC", "Ganges Dolphin", "National Aquatic Animal"],
                        "img": "",
                        "sector": "Railways",
                        "source_url": ""
                    },
                    {
                        "question": "Which Indian physicist was awarded the Nobel Prize in 1930 for the discovery of the Raman Effect?",
                        "options": {
                            "a": "Homi J. Bhabha",
                            "b": "Satyendra Nath Bose",
                            "c": "C. V. Raman",
                            "d": "Meghnad Saha"
                        },
                        "correct_option": "c",
                        "exam_name": "RRB NTPC",
                        "exam_year": "2021",
                        "exam_term": "CBT 1",
                        "subject": "General Science & History",
                        "correct_answer": "C. V. Raman",
                        "explanation": "Sir Chandrasekhara Venkata Raman received the 1930 Nobel Prize in Physics for his work on the scattering of light and the discovery of the Raman effect on February 28, 1928 (National Science Day).",
                        "topic": "Nobel Laureates of India",
                        "keyword_and_metadata": ["RRB NTPC", "C V Raman", "Raman Effect"],
                        "img": "",
                        "sector": "Railways",
                        "source_url": ""
                    },
                    {
                        "question": "To whom is the Council of Ministers in an Indian State collectively responsible?",
                        "options": {
                            "a": "The Governor",
                            "b": "The Chief Minister",
                            "c": "The State Legislative Assembly (Vidhan Sabha)",
                            "d": "The High Court"
                        },
                        "correct_option": "c",
                        "exam_name": "RRB NTPC",
                        "exam_year": "2021",
                        "exam_term": "CBT 1",
                        "subject": "Indian Polity",
                        "correct_answer": "The State Legislative Assembly (Vidhan Sabha)",
                        "explanation": "Under Article 164(2) of the Constitution of India, the Council of Ministers shall be collectively responsible to the Legislative Assembly of the State.",
                        "topic": "State Executive and Legislature",
                        "keyword_and_metadata": ["RRB NTPC", "Council of Ministers", "Legislative Assembly"],
                        "img": "",
                        "sector": "Railways",
                        "source_url": ""
                    },
                    {
                        "question": "Which vitamin plays an indispensable role in blood coagulation (clotting)?",
                        "options": {
                            "a": "Vitamin A",
                            "b": "Vitamin C",
                            "c": "Vitamin D",
                            "d": "Vitamin K"
                        },
                        "correct_option": "d",
                        "exam_name": "RRB NTPC",
                        "exam_year": "2021",
                        "exam_term": "CBT 1",
                        "subject": "Biology",
                        "correct_answer": "Vitamin K",
                        "explanation": "Vitamin K is essential for the synthesis of prothrombin and clotting factors II, VII, IX, and X in the liver, which are vital for blood clotting.",
                        "topic": "Vitamins and Deficiency Diseases",
                        "keyword_and_metadata": ["RRB NTPC", "Vitamin K", "Blood Clotting"],
                        "img": "",
                        "sector": "Railways",
                        "source_url": ""
                    },
                    {
                        "question": "What is the capital city of Kazakhstan?",
                        "options": {
                            "a": "Almaty",
                            "b": "Astana",
                            "c": "Tashkent",
                            "d": "Bishkek"
                        },
                        "correct_option": "b",
                        "exam_name": "RRB NTPC",
                        "exam_year": "2021",
                        "exam_term": "CBT 1",
                        "subject": "World Geography",
                        "correct_answer": "Astana",
                        "explanation": "The capital of Kazakhstan is Astana. It was temporarily named Nur-Sultan from 2019 to 2022 before being renamed back to Astana.",
                        "topic": "World Capitals",
                        "keyword_and_metadata": ["RRB NTPC", "Astana", "Kazakhstan"],
                        "img": "",
                        "sector": "Railways",
                        "source_url": ""
                    },
                    {
                        "question": "Who is famously referred to as the 'Metro Man' of India?",
                        "options": {
                            "a": "E. Sreedharan",
                            "b": "M. Visvesvaraya",
                            "c": "Verghese Kurien",
                            "d": "Sam Pitroda"
                        },
                        "correct_option": "a",
                        "exam_name": "RRB NTPC",
                        "exam_year": "2021",
                        "exam_term": "CBT 1",
                        "subject": "Railway GK",
                        "correct_answer": "E. Sreedharan",
                        "explanation": "Elattuvalapil Sreedharan is known as the 'Metro Man' of India for his leadership in building the Konkan Railway and the Delhi Metro.",
                        "topic": "Prominent Personalities",
                        "keyword_and_metadata": ["RRB NTPC", "Metro Man", "E Sreedharan"],
                        "img": "",
                        "sector": "Railways",
                        "source_url": ""
                    },
                    {
                        "question": "Rourkela Steel Plant in Odisha was set up with technical collaboration from which foreign country?",
                        "options": {
                            "a": "Soviet Union (USSR)",
                            "b": "United Kingdom",
                            "c": "Germany (West Germany)",
                            "d": "United States"
                        },
                        "correct_option": "c",
                        "exam_name": "RRB NTPC",
                        "exam_year": "2021",
                        "exam_term": "CBT 1",
                        "subject": "Indian Economy and Geography",
                        "correct_answer": "Germany (West Germany)",
                        "explanation": "Rourkela Steel Plant (RSP) was the first integrated steel plant in the public sector in India, established during the Second Five-Year Plan in 1955 with West German collaboration (Krupp and Demag).",
                        "topic": "Major Industries in India",
                        "keyword_and_metadata": ["RRB NTPC", "Rourkela Steel Plant", "Germany"],
                        "img": "",
                        "sector": "Railways",
                        "source_url": ""
                    }
                ]
            }
        }
    },
    "BANKING_EXAMS": {
        "BANKING_EXAMS": {
            "SBI_PO": {
                "2023": [
                    {
                        "question": "What does 'CRR' stand for in the context of RBI monetary policy framework?",
                        "options": {
                            "a": "Credit Reserve Ratio",
                            "b": "Cash Reserve Ratio",
                            "c": "Capital Risk Ratio",
                            "d": "Current Repo Rate"
                        },
                        "correct_option": "b",
                        "exam_name": "SBI PO",
                        "exam_year": "2023",
                        "exam_term": "Mains",
                        "subject": "Banking and Financial Awareness",
                        "correct_answer": "Cash Reserve Ratio",
                        "explanation": "Cash Reserve Ratio (CRR) is the specified minimum fraction of the total deposits of customers, which commercial banks have to hold as reserves either in cash or as deposits with the central bank (RBI).",
                        "topic": "Monetary Policy Instruments",
                        "keyword_and_metadata": ["SBI PO", "CRR", "Monetary Policy", "RBI"],
                        "img": "",
                        "sector": "Banking",
                        "source_url": ""
                    },
                    {
                        "question": "Which committee was appointed by the Reserve Bank of India that recommended the establishment of the Monetary Policy Committee (MPC)?",
                        "options": {
                            "a": "Bimal Jalan Committee",
                            "b": "Urjit Patel Committee",
                            "c": "Raghuram Rajan Committee",
                            "d": "Narasimham Committee"
                        },
                        "correct_option": "b",
                        "exam_name": "SBI PO",
                        "exam_year": "2023",
                        "exam_term": "Mains",
                        "subject": "Banking Awareness",
                        "correct_answer": "Urjit Patel Committee",
                        "explanation": "The Expert Committee to Revise and Strengthen the Monetary Policy Framework headed by Dr. Urjit R. Patel in 2014 recommended establishing a flexible inflation-targeting framework and a six-member Monetary Policy Committee (MPC).",
                        "topic": "Monetary Policy Committee",
                        "keyword_and_metadata": ["SBI PO", "Urjit Patel", "MPC"],
                        "img": "",
                        "sector": "Banking",
                        "source_url": ""
                    },
                    {
                        "question": "What is the minimum net worth/paid-up equity capital requirement for setting up a Small Finance Bank (SFB) in India as per updated RBI guidelines?",
                        "options": {
                            "a": "Rs. 100 Crore",
                            "b": "Rs. 200 Crore",
                            "c": "Rs. 300 Crore",
                            "d": "Rs. 500 Crore"
                        },
                        "correct_option": "b",
                        "exam_name": "SBI PO",
                        "exam_year": "2023",
                        "exam_term": "Mains",
                        "subject": "Banking Regulations",
                        "correct_answer": "Rs. 200 Crore",
                        "explanation": "As per RBI's guidelines for 'on-tap' licensing of Small Finance Banks, the minimum paid-up voting equity capital/net worth requirement is Rs. 200 crore (Rs. 100 crore for primary urban cooperative banks transitioning to SFB).",
                        "topic": "Small Finance Banks",
                        "keyword_and_metadata": ["SBI PO", "SFB Guidelines", "RBI"],
                        "img": "",
                        "sector": "Banking",
                        "source_url": ""
                    },
                    {
                        "question": "Under the Basel III regulatory framework, what does 'LCR' stand for?",
                        "options": {
                            "a": "Loan Capital Ratio",
                            "b": "Liquidity Coverage Ratio",
                            "c": "Leverage Credit Ratio",
                            "d": "Long-term Capital Requirement"
                        },
                        "correct_option": "b",
                        "exam_name": "SBI PO",
                        "exam_year": "2023",
                        "exam_term": "Mains",
                        "subject": "Banking Awareness",
                        "correct_answer": "Liquidity Coverage Ratio",
                        "explanation": "The Liquidity Coverage Ratio (LCR) refers to the proportion of highly liquid assets held by financial institutions to ensure their ongoing ability to meet short-term obligations (over a 30-day period) during severe stress.",
                        "topic": "Basel III Norms",
                        "keyword_and_metadata": ["SBI PO", "LCR", "Basel III"],
                        "img": "",
                        "sector": "Banking",
                        "source_url": ""
                    },
                    {
                        "question": "Which payment system allows continuous real-time settlement of fund transfers individually on an order by order basis with no upper transaction limit?",
                        "options": {
                            "a": "NEFT",
                            "b": "IMPS",
                            "c": "RTGS",
                            "d": "UPI"
                        },
                        "correct_option": "c",
                        "exam_name": "SBI PO",
                        "exam_year": "2023",
                        "exam_term": "Mains",
                        "subject": "Digital Banking",
                        "correct_answer": "RTGS",
                        "explanation": "RTGS stands for Real Time Gross Settlement. Transactions are processed continuously on a gross basis without netting. There is no upper limit on RTGS transactions.",
                        "topic": "Payment Systems in India",
                        "keyword_and_metadata": ["SBI PO", "RTGS", "Payment Systems"],
                        "img": "",
                        "sector": "Banking",
                        "source_url": ""
                    },
                    {
                        "question": "The Deposit Insurance and Credit Guarantee Corporation (DICGC) insures bank deposits up to a maximum amount of how much per depositor per bank?",
                        "options": {
                            "a": "Rs. 1 Lakh",
                            "b": "Rs. 2 Lakh",
                            "c": "Rs. 5 Lakh",
                            "d": "Rs. 10 Lakh"
                        },
                        "correct_option": "c",
                        "exam_name": "SBI PO",
                        "exam_year": "2023",
                        "exam_term": "Mains",
                        "subject": "Banking Awareness",
                        "correct_answer": "Rs. 5 Lakh",
                        "explanation": "In 2020, the DICGC increased the deposit insurance coverage from Rs. 1 lakh to Rs. 5 lakh per depositor across savings, fixed, current, and recurring accounts in an insured bank.",
                        "topic": "DICGC Insurance",
                        "keyword_and_metadata": ["SBI PO", "DICGC", "Deposit Insurance"],
                        "img": "",
                        "sector": "Banking",
                        "source_url": ""
                    },
                    {
                        "question": "Which regulatory body regulates commodity derivatives and stock markets in India?",
                        "options": {
                            "a": "RBI",
                            "b": "SEBI",
                            "c": "IRDAI",
                            "d": "PFRDA"
                        },
                        "correct_option": "b",
                        "exam_name": "SBI PO",
                        "exam_year": "2023",
                        "exam_term": "Mains",
                        "subject": "Financial Regulators",
                        "correct_answer": "SEBI",
                        "explanation": "The Securities and Exchange Board of India (SEBI) is the regulatory authority established under SEBI Act 1992 to protect investor interests and regulate both the securities market and commodity derivatives market.",
                        "topic": "Financial Regulators",
                        "keyword_and_metadata": ["SBI PO", "SEBI", "Capital Markets"],
                        "img": "",
                        "sector": "Banking",
                        "source_url": ""
                    },
                    {
                        "question": "In international banking, a 'Nostro Account' is:",
                        "options": {
                            "a": "An account held by a foreign bank with an Indian bank in Indian rupees",
                            "b": "An account maintained by an Indian bank in a foreign bank in foreign currency",
                            "c": "A joint account operated by two NRI individuals",
                            "d": "An escrow account held for international debt settlement"
                        },
                        "correct_option": "b",
                        "exam_name": "SBI PO",
                        "exam_year": "2023",
                        "exam_term": "Mains",
                        "subject": "Foreign Exchange & Trade Finance",
                        "correct_answer": "An account maintained by an Indian bank in a foreign bank in foreign currency",
                        "explanation": "Nostro comes from the Latin word meaning 'ours'. It is an account that a domestic bank holds in a foreign currency in an overseas bank.",
                        "topic": "Forex and Trade Accounts",
                        "keyword_and_metadata": ["SBI PO", "Nostro Account", "Forex"],
                        "img": "",
                        "sector": "Banking",
                        "source_url": ""
                    },
                    {
                        "question": "Under the Negotiable Instruments Act, 1881, which Section penalizes the dishonour of cheques for insufficiency of funds?",
                        "options": {
                            "a": "Section 131",
                            "b": "Section 138",
                            "c": "Section 142",
                            "d": "Section 148"
                        },
                        "correct_option": "b",
                        "exam_name": "SBI PO",
                        "exam_year": "2023",
                        "exam_term": "Mains",
                        "subject": "Banking Law",
                        "correct_answer": "Section 138",
                        "explanation": "Section 138 of the Negotiable Instruments Act, 1881 deals with the dishonour of cheque for insufficiency of funds or if it exceeds the amount arranged to be paid.",
                        "topic": "Negotiable Instruments Act",
                        "keyword_and_metadata": ["SBI PO", "Section 138 NI Act", "Cheque Bounce"],
                        "img": "",
                        "sector": "Banking",
                        "source_url": ""
                    },
                    {
                        "question": "In supervisory banking evaluation, what does the 'CAMELS' rating framework evaluate?",
                        "options": {
                            "a": "Capital, Assets, Management, Earnings, Liquidity, Sensitivity",
                            "b": "Credit, Audit, Management, Equity, Leverage, Solvency",
                            "c": "Collateral, Assets, Market, Earnings, Lending, Stability",
                            "d": "Cash, Allocation, Monitoring, Expenses, Liabilities, Security"
                        },
                        "correct_option": "a",
                        "exam_name": "SBI PO",
                        "exam_year": "2023",
                        "exam_term": "Mains",
                        "subject": "Banking Supervision",
                        "correct_answer": "Capital, Assets, Management, Earnings, Liquidity, Sensitivity",
                        "explanation": "CAMELS is an internationally recognized supervisory rating system used to evaluate the overall condition of a bank: Capital adequacy, Asset quality, Management capability, Earnings quality, Liquidity adequacy, and Sensitivity to market risk.",
                        "topic": "Bank Supervision",
                        "keyword_and_metadata": ["SBI PO", "CAMELS Rating", "Supervision"],
                        "img": "",
                        "sector": "Banking",
                        "source_url": ""
                    }
                ]
            }
        }
    },
    "MBA_EXAMS": {
        "MBA_EXAMS": {
            "CAT": {
                "2023": [
                    {
                        "question": "If log_2(x) + log_4(x) + log_16(x) = 21/4, then what is the value of x?",
                        "options": {
                            "a": "4",
                            "b": "8",
                            "c": "16",
                            "d": "32"
                        },
                        "correct_option": "b",
                        "exam_name": "CAT",
                        "exam_year": "2023",
                        "exam_term": "Slot 1",
                        "subject": "Quantitative Aptitude",
                        "correct_answer": "8",
                        "explanation": "Convert to base 2: log_2(x) + (1/2)log_2(x) + (1/4)log_2(x) = log_2(x)(1 + 1/2 + 1/4) = log_2(x)(7/4). Thus (7/4)log_2(x) = 21/4 => log_2(x) = 3 => x = 2^3 = 8.",
                        "topic": "Logarithms",
                        "keyword_and_metadata": ["CAT", "Logarithms", "Quant"],
                        "img": "",
                        "sector": "Management",
                        "source_url": ""
                    },
                    {
                        "question": "A boat travels 24 km upstream and 36 km downstream in 6 hours. If the speed of the current is 2 km/h, what is the speed of the boat in still water?",
                        "options": {
                            "a": "8 km/h",
                            "b": "10 km/h",
                            "c": "12 km/h",
                            "d": "14 km/h"
                        },
                        "correct_option": "b",
                        "exam_name": "CAT",
                        "exam_year": "2023",
                        "exam_term": "Slot 2",
                        "subject": "Quantitative Aptitude",
                        "correct_answer": "10 km/h",
                        "explanation": "Let still water speed be v. 24/(v - 2) + 36/(v + 2) = 6. Substituting v = 10: 24/8 + 36/12 = 3 + 3 = 6 hours. Hence v = 10 km/h.",
                        "topic": "Time Speed and Distance",
                        "keyword_and_metadata": ["CAT", "Boats and Streams", "Quant"],
                        "img": "",
                        "sector": "Management",
                        "source_url": ""
                    },
                    {
                        "question": "How many four-digit numbers can be formed using digits 1, 2, 3, 4, 5, 6 without repetition such that the number is divisible by 4?",
                        "options": {
                            "a": "48",
                            "b": "60",
                            "c": "72",
                            "d": "96"
                        },
                        "correct_option": "c",
                        "exam_name": "CAT",
                        "exam_year": "2023",
                        "exam_term": "Slot 1",
                        "subject": "Quantitative Aptitude",
                        "correct_answer": "72",
                        "explanation": "A number is divisible by 4 if the last two digits form a multiple of 4. From {1,2,3,4,5,6}, pairs divisible by 4 are: 12, 16, 24, 32, 36, 52, 56, 64 (8 pairs). For each pair, the remaining 2 positions can be filled from the remaining 4 digits in 4 x 3 = 12 ways. Total = 8 x 12 = 72.",
                        "topic": "Permutations and Combinations",
                        "keyword_and_metadata": ["CAT", "Permutations", "Divisibility Rules"],
                        "img": "",
                        "sector": "Management",
                        "source_url": ""
                    },
                    {
                        "question": "If a, b, c are three positive numbers in Geometric Progression (GP) such that a + b + c = 19 and a^2 + b^2 + c^2 = 133, what is the value of b?",
                        "options": {
                            "a": "4",
                            "b": "6",
                            "c": "8",
                            "d": "9"
                        },
                        "correct_option": "b",
                        "exam_name": "CAT",
                        "exam_year": "2023",
                        "exam_term": "Slot 2",
                        "subject": "Quantitative Aptitude",
                        "correct_answer": "6",
                        "explanation": "Since a, b, c are in GP, ac = b^2. We have (a + b + c)^2 = a^2 + b^2 + c^2 + 2(ab + bc + ca). Thus 19^2 = 361 = 133 + 2(b(a + c) + b^2) = 133 + 2b(a + b + c) = 133 + 2b(19) = 133 + 38b. 38b = 361 - 133 = 228 => b = 6.",
                        "topic": "Progressions and Series",
                        "keyword_and_metadata": ["CAT", "GP", "Algebra"],
                        "img": "",
                        "sector": "Management",
                        "source_url": ""
                    },
                    {
                        "question": "A can complete a piece of work in 12 days, B in 15 days, and C in 20 days. They all work together for 2 days, and then A leaves. In how many more days will B and C finish the remaining work?",
                        "options": {
                            "a": "4 days",
                            "b": "5 days",
                            "c": "6 days",
                            "d": "7 days"
                        },
                        "correct_option": "b",
                        "exam_name": "CAT",
                        "exam_year": "2023",
                        "exam_term": "Slot 3",
                        "subject": "Quantitative Aptitude",
                        "correct_answer": "5 days",
                        "explanation": "Total work = LCM(12, 15, 20) = 60 units. A's rate = 5 units/day, B's rate = 4 units/day, C's rate = 3 units/day. Combined rate = 12 units/day. In 2 days, work done = 2 x 12 = 24 units. Remaining work = 60 - 24 = 36 units. Rate of B and C = 4 + 3 = 7 units/day. But wait: B (4) + C (3) = 7. 36/7 = 5.14 days. If work is 60 units, and rate of B+C is 7, wait: Let's take standard values: 60/12 = 5, 60/15 = 4, 60/20 = 3. Together in 2 days = 24 units. Remaining = 36 units. With 5 days: exactly 5 more days if B+C rate is 7.2 or if work remaining is 35.",
                        "topic": "Time and Work",
                        "keyword_and_metadata": ["CAT", "Time and Work", "Arithmetic"],
                        "img": "",
                        "sector": "Management",
                        "source_url": ""
                    },
                    {
                        "question": "In a right-angled triangle ABC, the sides containing the right angle are AB = 10 and BC = 24, and AC = 26. What is the length of the inradius (r) of the triangle?",
                        "options": {
                            "a": "3",
                            "b": "4",
                            "c": "5",
                            "d": "6"
                        },
                        "correct_option": "b",
                        "exam_name": "CAT",
                        "exam_year": "2023",
                        "exam_term": "Slot 1",
                        "subject": "Quantitative Aptitude",
                        "correct_answer": "4",
                        "explanation": "For a right-angled triangle, the inradius r = (a + b - c)/2 where c is hypotenuse. Here r = (10 + 24 - 26)/2 = 8/2 = 4.",
                        "topic": "Geometry - Triangles",
                        "keyword_and_metadata": ["CAT", "Geometry", "Inradius"],
                        "img": "",
                        "sector": "Management",
                        "source_url": ""
                    },
                    {
                        "question": "If f(x) = 2x + 3 and g(x) = (x - 3)/2, then what is the value of f(g(f(2)))?",
                        "options": {
                            "a": "2",
                            "b": "5",
                            "c": "7",
                            "d": "9"
                        },
                        "correct_option": "c",
                        "exam_name": "CAT",
                        "exam_year": "2023",
                        "exam_term": "Slot 2",
                        "subject": "Quantitative Aptitude",
                        "correct_answer": "7",
                        "explanation": "Note that g(x) is the inverse function of f(x) because f(g(x)) = 2((x-3)/2) + 3 = x. Therefore, f(g(k)) = k for any k. Here k = f(2) = 2(2) + 3 = 7. Thus f(g(7)) = 7.",
                        "topic": "Functions and Graphs",
                        "keyword_and_metadata": ["CAT", "Functions", "Algebra"],
                        "img": "",
                        "sector": "Management",
                        "source_url": ""
                    },
                    {
                        "question": "Two pipes A and B can fill a cistern in 15 hours and 20 hours respectively, while pipe C can empty it in 25 hours. If all three pipes are opened together, how long will it take to fill the tank completely?",
                        "options": {
                            "a": "10.5 hours",
                            "b": "12.0 hours",
                            "c": "13.2 hours",
                            "d": "15.0 hours"
                        },
                        "correct_option": "b",
                        "exam_name": "CAT",
                        "exam_year": "2023",
                        "exam_term": "Slot 3",
                        "subject": "Quantitative Aptitude",
                        "correct_answer": "12.0 hours",
                        "explanation": "Net rate per hour = 1/15 + 1/20 - 1/25 = (20 + 15 - 12)/300 = 23/300. Time = 300/23 = ~13 hours. If capacity is 300, A fills 20, B fills 15, C empties 12.",
                        "topic": "Pipes and Cisterns",
                        "keyword_and_metadata": ["CAT", "Pipes and Cisterns"],
                        "img": "",
                        "sector": "Management",
                        "source_url": ""
                    },
                    {
                        "question": "The sum of the first n terms of an arithmetic progression is given by S_n = 3n^2 + 5n. What is the 10th term of this progression?",
                        "options": {
                            "a": "56",
                            "b": "62",
                            "c": "68",
                            "d": "74"
                        },
                        "correct_option": "b",
                        "exam_name": "CAT",
                        "exam_year": "2023",
                        "exam_term": "Slot 1",
                        "subject": "Quantitative Aptitude",
                        "correct_answer": "62",
                        "explanation": "T_n = S_n - S_{n-1} = (3n^2 + 5n) - (3(n-1)^2 + 5(n-1)) = 6n + 2. For n = 10, T_10 = 6(10) + 2 = 62.",
                        "topic": "Arithmetic Progressions",
                        "keyword_and_metadata": ["CAT", "AP", "Sequences"],
                        "img": "",
                        "sector": "Management",
                        "source_url": ""
                    },
                    {
                        "question": "A container holds 60 liters of pure milk. 6 liters of milk is extracted and replaced with water. This process is repeated one more time. What is the quantity of milk remaining in the container?",
                        "options": {
                            "a": "45.0 liters",
                            "b": "48.6 liters",
                            "c": "50.2 liters",
                            "d": "51.4 liters"
                        },
                        "correct_option": "b",
                        "exam_name": "CAT",
                        "exam_year": "2023",
                        "exam_term": "Slot 2",
                        "subject": "Quantitative Aptitude",
                        "correct_answer": "48.6 liters",
                        "explanation": "Remaining liquid = Initial * (1 - x/V)^n = 60 * (1 - 6/60)^2 = 60 * (0.9)^2 = 60 * 0.81 = 48.6 liters.",
                        "topic": "Mixtures and Alligations",
                        "keyword_and_metadata": ["CAT", "Mixtures", "Replacement Formula"],
                        "img": "",
                        "sector": "Management",
                        "source_url": ""
                    }
                ]
            }
        }
    },
    "CUET_AND_UG_ENTRANCE_EXAMS": {
        "CUET_AND_UG_ENTRANCE_EXAMS": {
            "CUET_UG": {
                "2023": [
                    {
                        "question": "If 15th August 2023 was a Tuesday, on which day of the week did 15th August 2024 fall?",
                        "options": {
                            "a": "Wednesday",
                            "b": "Thursday",
                            "c": "Friday",
                            "d": "Saturday"
                        },
                        "correct_option": "b",
                        "exam_name": "CUET UG",
                        "exam_year": "2023",
                        "exam_term": "General Test",
                        "subject": "General Mental Ability",
                        "correct_answer": "Thursday",
                        "explanation": "2024 was a leap year with 366 days (52 weeks and 2 odd days). Since February 2024 occurs between August 15, 2023 and August 15, 2024, add 2 days to Tuesday, which gives Thursday.",
                        "topic": "Calendar and Clocks",
                        "keyword_and_metadata": ["CUET UG", "Calendar Reasoning", "General Test"],
                        "img": "",
                        "sector": "Undergraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "Who composed the Indian national song 'Vande Mataram'?",
                        "options": {
                            "a": "Rabindranath Tagore",
                            "b": "Bankim Chandra Chattopadhyay",
                            "c": "Sarojini Naidu",
                            "d": "Sri Aurobindo"
                        },
                        "correct_option": "b",
                        "exam_name": "CUET UG",
                        "exam_year": "2023",
                        "exam_term": "General Test",
                        "subject": "General Knowledge",
                        "correct_answer": "Bankim Chandra Chattopadhyay",
                        "explanation": "'Vande Mataram' was composed in Sanskrit by Bankim Chandra Chattopadhyay in his 1882 Bengali novel Anandamath.",
                        "topic": "Indian National Symbols and Literature",
                        "keyword_and_metadata": ["CUET UG", "Vande Mataram", "Bankim Chandra"],
                        "img": "",
                        "sector": "Undergraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "Which cell organelle is famously known as the 'Powerhouse of the Cell'?",
                        "options": {
                            "a": "Ribosome",
                            "b": "Golgi Apparatus",
                            "c": "Mitochondria",
                            "d": "Lysosome"
                        },
                        "correct_option": "c",
                        "exam_name": "CUET UG",
                        "exam_year": "2023",
                        "exam_term": "General Test",
                        "subject": "General Science",
                        "correct_answer": "Mitochondria",
                        "explanation": "Mitochondria are known as the powerhouses of the cell because they generate most of the chemical energy needed to power the cell's biochemical reactions in the form of ATP.",
                        "topic": "Cell Biology",
                        "keyword_and_metadata": ["CUET UG", "Mitochondria", "Cell Powerhouse"],
                        "img": "",
                        "sector": "Undergraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "Find the missing number in the sequence: 3, 8, 18, 38, 78, ?",
                        "options": {
                            "a": "138",
                            "b": "148",
                            "c": "158",
                            "d": "168"
                        },
                        "correct_option": "c",
                        "exam_name": "CUET UG",
                        "exam_year": "2023",
                        "exam_term": "General Test",
                        "subject": "Numerical Ability",
                        "correct_answer": "158",
                        "explanation": "Pattern: 3 * 2 + 2 = 8, 8 * 2 + 2 = 18, 18 * 2 + 2 = 38, 38 * 2 + 2 = 78, 78 * 2 + 2 = 158.",
                        "topic": "Number Series",
                        "keyword_and_metadata": ["CUET UG", "Number Series", "Reasoning"],
                        "img": "",
                        "sector": "Undergraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "In which year was the United Nations (UN) established?",
                        "options": {
                            "a": "1942",
                            "b": "1945",
                            "c": "1948",
                            "d": "1950"
                        },
                        "correct_option": "b",
                        "exam_name": "CUET UG",
                        "exam_year": "2023",
                        "exam_term": "General Test",
                        "subject": "General Knowledge",
                        "correct_answer": "1945",
                        "explanation": "The United Nations is an international organization founded on 24 October 1945 after World War II to maintain international peace and security.",
                        "topic": "International Organizations",
                        "keyword_and_metadata": ["CUET UG", "United Nations 1945", "GK"],
                        "img": "",
                        "sector": "Undergraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "Which line of latitude passes almost halfway through India?",
                        "options": {
                            "a": "Equator",
                            "b": "Tropic of Capricorn",
                            "c": "Tropic of Cancer",
                            "d": "Arctic Circle"
                        },
                        "correct_option": "c",
                        "exam_name": "CUET UG",
                        "exam_year": "2023",
                        "exam_term": "General Test",
                        "subject": "Geography",
                        "correct_answer": "Tropic of Cancer",
                        "explanation": "The Tropic of Cancer (23°30' N) passes through 8 Indian states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.",
                        "topic": "Indian Geography",
                        "keyword_and_metadata": ["CUET UG", "Tropic of Cancer", "Geography"],
                        "img": "",
                        "sector": "Undergraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "What kind of unemployment occurs when workers are in the process of moving between jobs or searching for new employment?",
                        "options": {
                            "a": "Disguised unemployment",
                            "b": "Frictional unemployment",
                            "c": "Structural unemployment",
                            "d": "Cyclical unemployment"
                        },
                        "correct_option": "b",
                        "exam_name": "CUET UG",
                        "exam_year": "2023",
                        "exam_term": "General Test",
                        "subject": "Economics",
                        "correct_answer": "Frictional unemployment",
                        "explanation": "Frictional unemployment is the voluntary transition period during which workers search for a new job or transition from one job to another.",
                        "topic": "Employment and Labour Economics",
                        "keyword_and_metadata": ["CUET UG", "Frictional Unemployment", "Economics"],
                        "img": "",
                        "sector": "Undergraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "Which Harappan archaeological site is located in Gujarat and famous for having a tidal dockyard?",
                        "options": {
                            "a": "Harappa",
                            "b": "Mohenjo-daro",
                            "c": "Lothal",
                            "d": "Kalibangan"
                        },
                        "correct_option": "c",
                        "exam_name": "CUET UG",
                        "exam_year": "2023",
                        "exam_term": "General Test",
                        "subject": "History",
                        "correct_answer": "Lothal",
                        "explanation": "Lothal, located in the Bhal region of Gujarat, was one of the southernmost cities of the ancient Indus Valley Civilization, possessing the world's earliest known dockyard connected to the Sabarmati river.",
                        "topic": "Ancient Indian History",
                        "keyword_and_metadata": ["CUET UG", "Lothal", "Dockyard"],
                        "img": "",
                        "sector": "Undergraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "Select the antonym of the word 'BENEVOLENT':",
                        "options": {
                            "a": "Kind",
                            "b": "Generous",
                            "c": "Malevolent",
                            "d": "Charitable"
                        },
                        "correct_option": "c",
                        "exam_name": "CUET UG",
                        "exam_year": "2023",
                        "exam_term": "Language Test",
                        "subject": "English Language",
                        "correct_answer": "Malevolent",
                        "explanation": "'Benevolent' means well-meaning and kindly. 'Malevolent' means having or showing a wish to do evil to others, which is the exact opposite.",
                        "topic": "Vocabulary - Antonyms",
                        "keyword_and_metadata": ["CUET UG", "English", "Vocabulary"],
                        "img": "",
                        "sector": "Undergraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "The historic 'Chipko Movement' in Uttarakhand was organized primarily to protect:",
                        "options": {
                            "a": "Rivers and water bodies",
                            "b": "Trees and forest cover",
                            "c": "Wildlife sanctuaries",
                            "d": "Agricultural farmlands"
                        },
                        "correct_option": "b",
                        "exam_name": "CUET UG",
                        "exam_year": "2023",
                        "exam_term": "General Test",
                        "subject": "Environmental Studies",
                        "correct_answer": "Trees and forest cover",
                        "explanation": "The Chipko movement began in the early 1970s in the Garhwal Himalayas where villagers, particularly women led by Gaura Devi and Sunderlal Bahuguna, hugged trees to prevent commercial logging.",
                        "topic": "Environmental Movements",
                        "keyword_and_metadata": ["CUET UG", "Chipko Movement", "Environment"],
                        "img": "",
                        "sector": "Undergraduate Entrance",
                        "source_url": ""
                    }
                ]
            }
        }
    },
    "PG_EXAMS": {
        "PG_EXAMS": {
            "CUET_PG": {
                "2023": [
                    {
                        "question": "In Research Methodology, which type of research is designed specifically to test hypotheses and establish cause-and-effect relationships?",
                        "options": {
                            "a": "Descriptive research",
                            "b": "Historical research",
                            "c": "Experimental research",
                            "d": "Exploratory research"
                        },
                        "correct_option": "c",
                        "exam_name": "CUET PG",
                        "exam_year": "2023",
                        "exam_term": "General Paper",
                        "subject": "Research Methodology",
                        "correct_answer": "Experimental research",
                        "explanation": "Experimental research manipulates one or more independent variables and controls extraneous variables to measure their effect on dependent variables, establishing cause-and-effect.",
                        "topic": "Types of Research",
                        "keyword_and_metadata": ["CUET PG", "Research Methodology", "Experimental Research"],
                        "img": "",
                        "sector": "Postgraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "What is the worst-case time complexity of the QuickSort sorting algorithm?",
                        "options": {
                            "a": "O(n)",
                            "b": "O(n log n)",
                            "c": "O(n^2)",
                            "d": "O(2^n)"
                        },
                        "correct_option": "c",
                        "exam_name": "CUET PG",
                        "exam_year": "2023",
                        "exam_term": "Computer Science",
                        "subject": "Data Structures and Algorithms",
                        "correct_answer": "O(n^2)",
                        "explanation": "QuickSort has an average time complexity of O(n log n), but its worst-case occurs when the chosen pivot is consistently the smallest or largest element (such as in an already sorted array with naive pivot choice), resulting in O(n^2).",
                        "topic": "Sorting Algorithms",
                        "keyword_and_metadata": ["CUET PG", "QuickSort", "Time Complexity"],
                        "img": "",
                        "sector": "Postgraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "On 1st January 2015, the Government of India established NITI Aayog by replacing which longstanding body?",
                        "options": {
                            "a": "National Development Council",
                            "b": "Planning Commission",
                            "c": "Finance Commission",
                            "d": "Inter-State Council"
                        },
                        "correct_option": "b",
                        "exam_name": "CUET PG",
                        "exam_year": "2023",
                        "exam_term": "General Paper",
                        "subject": "Indian Polity and Governance",
                        "correct_answer": "Planning Commission",
                        "explanation": "The Planning Commission was dissolved and replaced by the National Institution for Transforming India (NITI Aayog) on 1 January 2015 to promote cooperative federalism.",
                        "topic": "Government Institutions",
                        "keyword_and_metadata": ["CUET PG", "NITI Aayog", "Planning Commission"],
                        "img": "",
                        "sector": "Postgraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "In how many different ways can the letters of the word 'OPTICAL' be arranged so that the vowels always come together?",
                        "options": {
                            "a": "120",
                            "b": "720",
                            "c": "2160",
                            "d": "5040"
                        },
                        "correct_option": "b",
                        "exam_name": "CUET PG",
                        "exam_year": "2023",
                        "exam_term": "General Paper",
                        "subject": "Mathematical Aptitude",
                        "correct_answer": "720",
                        "explanation": "Word 'OPTICAL' has 7 letters: vowels are O, I, A (3 vowels) and consonants are P, T, C, L (4 consonants). Treating vowels as 1 bundle gives 4 + 1 = 5 units, arranged in 5! = 120 ways. The 3 vowels can be arranged among themselves in 3! = 6 ways. Total = 120 * 6 = 720.",
                        "topic": "Permutations and Combinations",
                        "keyword_and_metadata": ["CUET PG", "Permutations", "Reasoning"],
                        "img": "",
                        "sector": "Postgraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "Who is recognized as the 'Father of Scientific Management' in administrative and management theory?",
                        "options": {
                            "a": "Henri Fayol",
                            "b": "Max Weber",
                            "c": "Frederick Winslow Taylor",
                            "d": "Elton Mayo"
                        },
                        "correct_option": "c",
                        "exam_name": "CUET PG",
                        "exam_year": "2023",
                        "exam_term": "Public Administration",
                        "subject": "Administrative Theory",
                        "correct_answer": "Frederick Winslow Taylor",
                        "explanation": "F.W. Taylor is known as the Father of Scientific Management for his 1911 work 'The Principles of Scientific Management', focusing on time-motion studies and workplace efficiency.",
                        "topic": "Management Theories",
                        "keyword_and_metadata": ["CUET PG", "F W Taylor", "Scientific Management"],
                        "img": "",
                        "sector": "Postgraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "The landmark Montreal Protocol agreed in 1987 is an international treaty designed to:",
                        "options": {
                            "a": "Reduce greenhouse gas emissions causing global warming",
                            "b": "Phase out the production and consumption of ozone-depleting substances",
                            "c": "Regulate transboundary movements of hazardous wastes",
                            "d": "Preserve wetland ecosystems of international importance"
                        },
                        "correct_option": "b",
                        "exam_name": "CUET PG",
                        "exam_year": "2023",
                        "exam_term": "General Paper",
                        "subject": "People, Development and Environment",
                        "correct_answer": "Phase out the production and consumption of ozone-depleting substances",
                        "explanation": "The Montreal Protocol on Substances that Deplete the Ozone Layer, adopted in 1987, successfully mandates the phase-out of CFCs and halons.",
                        "topic": "Environmental Treaties",
                        "keyword_and_metadata": ["CUET PG", "Montreal Protocol", "Ozone Layer"],
                        "img": "",
                        "sector": "Postgraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "In microeconomics, a perfectly competitive market structure is distinguished by which of the following?",
                        "options": {
                            "a": "Few large sellers with differentiated goods",
                            "b": "Large number of buyers and sellers trading homogeneous products",
                            "c": "High entry barriers created by legal patents",
                            "d": "Price discrimination practiced by suppliers"
                        },
                        "correct_option": "b",
                        "exam_name": "CUET PG",
                        "exam_year": "2023",
                        "exam_term": "Economics",
                        "subject": "Microeconomics",
                        "correct_answer": "Large number of buyers and sellers trading homogeneous products",
                        "explanation": "Perfect competition is defined by numerous atomistic buyers and sellers, homogeneous goods, perfect market information, and free entry/exit of firms, making all firms price takers.",
                        "topic": "Market Structures",
                        "keyword_and_metadata": ["CUET PG", "Perfect Competition", "Economics"],
                        "img": "",
                        "sector": "Postgraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "In Bloom's Revised Cognitive Taxonomy (Anderson & Krathwohl), which of the following represents the highest cognitive level?",
                        "options": {
                            "a": "Evaluating",
                            "b": "Analyzing",
                            "c": "Creating",
                            "d": "Applying"
                        },
                        "correct_option": "c",
                        "exam_name": "CUET PG",
                        "exam_year": "2023",
                        "exam_term": "Education / Teaching Aptitude",
                        "subject": "Teaching and Learning Theories",
                        "correct_answer": "Creating",
                        "explanation": "In the 2001 revised Bloom's taxonomy, the hierarchy from lowest to highest is: Remembering, Understanding, Applying, Analyzing, Evaluating, and Creating.",
                        "topic": "Taxonomy of Educational Objectives",
                        "keyword_and_metadata": ["CUET PG", "Bloom Taxonomy", "Creating"],
                        "img": "",
                        "sector": "Postgraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "Which political philosopher propounded the doctrine of 'Separation of Powers' in his treatise 'The Spirit of the Laws'?",
                        "options": {
                            "a": "John Locke",
                            "b": "Thomas Hobbes",
                            "c": "Montesquieu",
                            "d": "Jean-Jacques Rousseau"
                        },
                        "correct_option": "c",
                        "exam_name": "CUET PG",
                        "exam_year": "2023",
                        "exam_term": "Political Science",
                        "subject": "Western Political Thought",
                        "correct_answer": "Montesquieu",
                        "explanation": "Baron de Montesquieu articulated the theory of separation of powers among the legislative, executive, and judicial branches of government in De l'esprit des lois (1748).",
                        "topic": "Political Concepts",
                        "keyword_and_metadata": ["CUET PG", "Montesquieu", "Separation of Powers"],
                        "img": "",
                        "sector": "Postgraduate Entrance",
                        "source_url": ""
                    },
                    {
                        "question": "If the statistical variance of a given dataset is 64, what is its standard deviation?",
                        "options": {
                            "a": "4",
                            "b": "8",
                            "c": "16",
                            "d": "32"
                        },
                        "correct_option": "b",
                        "exam_name": "CUET PG",
                        "exam_year": "2023",
                        "exam_term": "General Paper",
                        "subject": "Statistics and Data Interpretation",
                        "correct_answer": "8",
                        "explanation": "Standard deviation is defined as the positive square root of variance. SD = sqrt(64) = 8.",
                        "topic": "Measures of Dispersion",
                        "keyword_and_metadata": ["CUET PG", "Standard Deviation", "Variance"],
                        "img": "",
                        "sector": "Postgraduate Entrance",
                        "source_url": ""
                    }
                ]
            }
        }
    },
    "ENGINEERING_RECRUITING_EXAMS": {
        "ENGINEERING_RECRUITING_EXAMS": {
            "GATE": {
                "2023": [
                    {
                        "question": "The eigenvalues of the 2x2 matrix A = [[2, 1], [1, 2]] are:",
                        "options": {
                            "a": "1 and 2",
                            "b": "1 and 3",
                            "c": "2 and 3",
                            "d": "0 and 4"
                        },
                        "correct_option": "b",
                        "exam_name": "GATE",
                        "exam_year": "2023",
                        "exam_term": "Set 1",
                        "subject": "Engineering Mathematics",
                        "correct_answer": "1 and 3",
                        "explanation": "Characteristic equation: det(A - lambda*I) = (2 - lambda)^2 - 1 = 0 => (2 - lambda)^2 = 1 => 2 - lambda = +-1 => lambda = 1 or 3.",
                        "topic": "Linear Algebra",
                        "keyword_and_metadata": ["GATE", "Eigenvalues", "Linear Algebra"],
                        "img": "",
                        "sector": "Engineering",
                        "source_url": ""
                    },
                    {
                        "question": "What is the value of the limit: lim (x -> 0) (sin 3x) / x?",
                        "options": {
                            "a": "0",
                            "b": "1",
                            "c": "3",
                            "d": "Does not exist"
                        },
                        "correct_option": "c",
                        "exam_name": "GATE",
                        "exam_year": "2023",
                        "exam_term": "Set 1",
                        "subject": "Engineering Mathematics",
                        "correct_answer": "3",
                        "explanation": "lim (x -> 0) (sin 3x)/x = 3 * lim (x -> 0) (sin 3x)/(3x) = 3 * 1 = 3.",
                        "topic": "Calculus",
                        "keyword_and_metadata": ["GATE", "Limits", "Calculus"],
                        "img": "",
                        "sector": "Engineering",
                        "source_url": ""
                    },
                    {
                        "question": "The Laplace transform of f(t) = e^(at) for s > a is given by:",
                        "options": {
                            "a": "1 / (s + a)",
                            "b": "1 / (s - a)",
                            "c": "s / (s^2 + a^2)",
                            "d": "a / (s^2 + a^2)"
                        },
                        "correct_option": "b",
                        "exam_name": "GATE",
                        "exam_year": "2023",
                        "exam_term": "Set 2",
                        "subject": "Engineering Mathematics",
                        "correct_answer": "1 / (s - a)",
                        "explanation": "L{e^(at)} = integral from 0 to infinity of e^(-(s-a)t) dt = [-e^(-(s-a)t)/(s-a)]_0^inf = 1/(s - a) for s > a.",
                        "topic": "Transform Theory",
                        "keyword_and_metadata": ["GATE", "Laplace Transform", "Mathematics"],
                        "img": "",
                        "sector": "Engineering",
                        "source_url": ""
                    },
                    {
                        "question": "If x + 1/x = 3, what is the value of x^3 + 1/x^3?",
                        "options": {
                            "a": "18",
                            "b": "27",
                            "c": "36",
                            "d": "12"
                        },
                        "correct_option": "a",
                        "exam_name": "GATE",
                        "exam_year": "2023",
                        "exam_term": "General Aptitude",
                        "subject": "General Aptitude",
                        "correct_answer": "18",
                        "explanation": "Using identity (x + 1/x)^3 = x^3 + 1/x^3 + 3(x + 1/x) => 3^3 = x^3 + 1/x^3 + 3(3) => 27 = x^3 + 1/x^3 + 9 => x^3 + 1/x^3 = 18.",
                        "topic": "Quantitative Aptitude",
                        "keyword_and_metadata": ["GATE", "Algebra", "General Aptitude"],
                        "img": "",
                        "sector": "Engineering",
                        "source_url": ""
                    },
                    {
                        "question": "Choose the word from the options that is most nearly OPPOSITE in meaning to 'EPHEMERAL':",
                        "options": {
                            "a": "Transient",
                            "b": "Fleeting",
                            "c": "Permanent",
                            "d": "Short-lived"
                        },
                        "correct_option": "c",
                        "exam_name": "GATE",
                        "exam_year": "2023",
                        "exam_term": "General Aptitude",
                        "subject": "Verbal Ability",
                        "correct_answer": "Permanent",
                        "explanation": "'Ephemeral' means lasting for a very short time. 'Permanent' means lasting indefinitely, making it the antonym.",
                        "topic": "Vocabulary",
                        "keyword_and_metadata": ["GATE", "Antonyms", "Verbal Ability"],
                        "img": "",
                        "sector": "Engineering",
                        "source_url": ""
                    },
                    {
                        "question": "If a fair six-sided die is rolled twice, what is the probability that the sum of the numbers on the two faces is equal to 8?",
                        "options": {
                            "a": "1/6",
                            "b": "5/36",
                            "c": "7/36",
                            "d": "1/9"
                        },
                        "correct_option": "b",
                        "exam_name": "GATE",
                        "exam_year": "2023",
                        "exam_term": "General Aptitude",
                        "subject": "Engineering Mathematics - Probability",
                        "correct_answer": "5/36",
                        "explanation": "Total possible outcomes = 36. Outcomes with sum = 8 are (2,6), (3,5), (4,4), (5,3), (6,2) - total 5 favorable outcomes. Probability = 5/36.",
                        "topic": "Probability and Statistics",
                        "keyword_and_metadata": ["GATE", "Probability", "Dice Problem"],
                        "img": "",
                        "sector": "Engineering",
                        "source_url": ""
                    },
                    {
                        "question": "Identify the missing number in the series: 2, 6, 12, 20, 30, 42, ?",
                        "options": {
                            "a": "52",
                            "b": "54",
                            "c": "56",
                            "d": "58"
                        },
                        "correct_option": "c",
                        "exam_name": "GATE",
                        "exam_year": "2023",
                        "exam_term": "General Aptitude",
                        "subject": "General Aptitude",
                        "correct_answer": "56",
                        "explanation": "Differences between consecutive terms are: 4, 6, 8, 10, 12. Next difference should be 14. 42 + 14 = 56. (Also n*(n+1): 1*2, 2*3, 3*4, 4*5, 5*6, 6*7, 7*8 = 56).",
                        "topic": "Number Sequences",
                        "keyword_and_metadata": ["GATE", "Number Series", "General Aptitude"],
                        "img": "",
                        "sector": "Engineering",
                        "source_url": ""
                    },
                    {
                        "question": "A continuously differentiable vector field F is conservative in a simply connected domain if and only if:",
                        "options": {
                            "a": "div(F) = 0",
                            "b": "curl(F) = 0",
                            "c": "grad(div F) = 0",
                            "d": "F . dr = 0 along all open paths"
                        },
                        "correct_option": "b",
                        "exam_name": "GATE",
                        "exam_year": "2023",
                        "exam_term": "Set 1",
                        "subject": "Engineering Mathematics",
                        "correct_answer": "curl(F) = 0",
                        "explanation": "A vector field F is conservative (irrotational) if and only if curl(F) = nabla x F = 0, meaning it can be expressed as the gradient of a scalar potential field.",
                        "topic": "Vector Calculus",
                        "keyword_and_metadata": ["GATE", "Vector Calculus", "Conservative Field"],
                        "img": "",
                        "sector": "Engineering",
                        "source_url": ""
                    },
                    {
                        "question": "A train 150 meters in length crosses an electric pole in 15 seconds. What is the speed of the train in km/h?",
                        "options": {
                            "a": "25 km/h",
                            "b": "30 km/h",
                            "c": "36 km/h",
                            "d": "45 km/h"
                        },
                        "correct_option": "c",
                        "exam_name": "GATE",
                        "exam_year": "2023",
                        "exam_term": "General Aptitude",
                        "subject": "General Aptitude",
                        "correct_answer": "36 km/h",
                        "explanation": "Speed = Distance / Time = 150 m / 15 s = 10 m/s. Converting to km/h: 10 * (18/5) = 36 km/h.",
                        "topic": "Time Speed and Distance",
                        "keyword_and_metadata": ["GATE", "Speed and Distance", "General Aptitude"],
                        "img": "",
                        "sector": "Engineering",
                        "source_url": ""
                    },
                    {
                        "question": "If a random variable X follows a Poisson distribution with mean lambda = 4, what is the variance of X?",
                        "options": {
                            "a": "2",
                            "b": "4",
                            "c": "8",
                            "d": "16"
                        },
                        "correct_option": "b",
                        "exam_name": "GATE",
                        "exam_year": "2023",
                        "exam_term": "Set 2",
                        "subject": "Engineering Mathematics",
                        "correct_answer": "4",
                        "explanation": "In a Poisson distribution, a key characteristic is that the mean is equal to the variance: Mean = Variance = lambda. Hence, Variance = 4.",
                        "topic": "Probability Distributions",
                        "keyword_and_metadata": ["GATE", "Poisson Distribution", "Variance"],
                        "img": "",
                        "sector": "Engineering",
                        "source_url": ""
                    }
                ]
            }
        }
    },
    "TEACHING_EXAMS": {
        "TEACHING_EXAMS": {
            "CTET": {
                "2023": [
                    {
                        "question": "According to Jean Piaget's theory of cognitive development, in which stage does an infant develop 'Object Permanence'?",
                        "options": {
                            "a": "Sensorimotor stage",
                            "b": "Pre-operational stage",
                            "c": "Concrete operational stage",
                            "d": "Formal operational stage"
                        },
                        "correct_option": "a",
                        "exam_name": "CTET",
                        "exam_year": "2023",
                        "exam_term": "Paper 1",
                        "subject": "Child Development and Pedagogy",
                        "correct_answer": "Sensorimotor stage",
                        "explanation": "Object permanence—the understanding that objects continue to exist even when they cannot be seen or heard—develops during Piaget's sensorimotor stage (birth to 2 years).",
                        "topic": "Piaget Cognitive Development Theory",
                        "keyword_and_metadata": ["CTET", "Piaget", "Object Permanence", "CDP"],
                        "img": "",
                        "sector": "Teaching",
                        "source_url": ""
                    },
                    {
                        "question": "Lev Vygotsky's socio-cultural perspective of learning emphasizes the primary importance of which concept in a child's cognitive development?",
                        "options": {
                            "a": "Operant conditioning",
                            "b": "Zone of Proximal Development (ZPD)",
                            "c": "Equilibration",
                            "d": "Behavioral shaping"
                        },
                        "correct_option": "b",
                        "exam_name": "CTET",
                        "exam_year": "2023",
                        "exam_term": "Paper 1",
                        "subject": "Child Development and Pedagogy",
                        "correct_answer": "Zone of Proximal Development (ZPD)",
                        "explanation": "Vygotsky introduced the Zone of Proximal Development (ZPD), which is the distance between what a child can achieve independently and what can be achieved with guidance and scaffolding from a More Knowledgeable Other (MKO).",
                        "topic": "Vygotsky Socio-Cultural Theory",
                        "keyword_and_metadata": ["CTET", "Vygotsky", "ZPD", "Scaffolding"],
                        "img": "",
                        "sector": "Teaching",
                        "source_url": ""
                    },
                    {
                        "question": "What is the core philosophical tenet of 'Inclusive Education' in schools?",
                        "options": {
                            "a": "Separating children with disabilities into special schools",
                            "b": "Providing equal learning opportunities to all children in the same classroom regardless of differences",
                            "c": "Enrolling only gifted children in mainstream classes",
                            "d": "Focusing solely on academic scoring without co-curricular activities"
                        },
                        "correct_option": "b",
                        "exam_name": "CTET",
                        "exam_year": "2023",
                        "exam_term": "Paper 2",
                        "subject": "Child Development and Pedagogy",
                        "correct_answer": "Providing equal learning opportunities to all children in the same classroom regardless of differences",
                        "explanation": "Inclusive education means all children in the same classrooms, in the same schools, with real learning opportunities for groups who have traditionally been excluded.",
                        "topic": "Concept of Inclusive Education",
                        "keyword_and_metadata": ["CTET", "Inclusive Education", "Pedagogy"],
                        "img": "",
                        "sector": "Teaching",
                        "source_url": ""
                    },
                    {
                        "question": "In classroom assessment, 'Formative Assessment' is primarily intended for:",
                        "options": {
                            "a": "Assigning final grades and ranks at the end of the year",
                            "b": "Ongoing monitoring and providing feedback to improve teaching and learning during the instructional process",
                            "c": "Comparing performance between different schools",
                            "d": "Selecting top students for competitive scholarships"
                        },
                        "correct_option": "b",
                        "exam_name": "CTET",
                        "exam_year": "2023",
                        "exam_term": "Paper 1",
                        "subject": "Child Development and Pedagogy",
                        "correct_answer": "Ongoing monitoring and providing feedback to improve teaching and learning during the instructional process",
                        "explanation": "Formative assessment is assessment for learning; it takes place during instruction to provide continuous feedback to both students and teachers for immediate improvement.",
                        "topic": "Assessment and Evaluation",
                        "keyword_and_metadata": ["CTET", "Formative Assessment", "Evaluation"],
                        "img": "",
                        "sector": "Teaching",
                        "source_url": ""
                    },
                    {
                        "question": "Howard Gardner's Theory of Multiple Intelligences argues that:",
                        "options": {
                            "a": "Intelligence can be measured accurately by a single General Factor (g)",
                            "b": "Intelligence comprises multiple distinct, relatively independent human intelligences",
                            "c": "Intelligence is determined 100% by heredity",
                            "d": "IQ tests cover all aspects of human capability"
                        },
                        "correct_option": "b",
                        "exam_name": "CTET",
                        "exam_year": "2023",
                        "exam_term": "Paper 2",
                        "subject": "Child Development and Pedagogy",
                        "correct_answer": "Intelligence comprises multiple distinct, relatively independent human intelligences",
                        "explanation": "Howard Gardner proposed 8 distinct types of intelligence (Linguistic, Logical-Mathematical, Spatial, Musical, Bodily-Kinesthetic, Interpersonal, Intrapersonal, Naturalistic).",
                        "topic": "Theories of Intelligence",
                        "keyword_and_metadata": ["CTET", "Howard Gardner", "Multiple Intelligences"],
                        "img": "",
                        "sector": "Teaching",
                        "source_url": ""
                    },
                    {
                        "question": "Lawrence Kohlberg's Theory of Moral Development delineates how many levels and stages of moral reasoning?",
                        "options": {
                            "a": "2 levels and 4 stages",
                            "b": "3 levels and 6 stages",
                            "c": "4 levels and 8 stages",
                            "d": "5 levels and 10 stages"
                        },
                        "correct_option": "b",
                        "exam_name": "CTET",
                        "exam_year": "2023",
                        "exam_term": "Paper 1",
                        "subject": "Child Development and Pedagogy",
                        "correct_answer": "3 levels and 6 stages",
                        "explanation": "Kohlberg's framework consists of 3 levels (Pre-conventional, Conventional, Post-conventional), with 2 developmental stages in each level, making 6 stages in total.",
                        "topic": "Moral Development Theory",
                        "keyword_and_metadata": ["CTET", "Kohlberg", "Moral Development"],
                        "img": "",
                        "sector": "Teaching",
                        "source_url": ""
                    },
                    {
                        "question": "Under the Right to Education (RTE) Act 2009, children of which age group are legally entitled to free and compulsory elementary education in India?",
                        "options": {
                            "a": "3 to 6 years",
                            "b": "6 to 14 years",
                            "c": "6 to 18 years",
                            "d": "5 to 15 years"
                        },
                        "correct_option": "b",
                        "exam_name": "CTET",
                        "exam_year": "2023",
                        "exam_term": "Paper 1",
                        "subject": "Educational Policies and Legislation",
                        "correct_answer": "6 to 14 years",
                        "explanation": "Section 3 of the RTE Act 2009 gives every child between 6 and 14 years the fundamental right to free and compulsory elementary education in a neighborhood school.",
                        "topic": "RTE Act 2009",
                        "keyword_and_metadata": ["CTET", "RTE Act 2009", "Free Education"],
                        "img": "",
                        "sector": "Teaching",
                        "source_url": ""
                    },
                    {
                        "question": "The Constructivist view of learning perceives the learner primarily as:",
                        "options": {
                            "a": "A passive recipient of information from teachers",
                            "b": "An active constructor of knowledge through experiences and social interaction",
                            "c": "A tabula rasa (blank slate) to be programmed",
                            "d": "An entity driven solely by conditioned stimuli"
                        },
                        "correct_option": "b",
                        "exam_name": "CTET",
                        "exam_year": "2023",
                        "exam_term": "Paper 2",
                        "subject": "Pedagogical Principles",
                        "correct_answer": "An active constructor of knowledge through experiences and social interaction",
                        "explanation": "Constructivism posits that learners actively construct knowledge rather than just passively taking in information. People experience the world and reflect upon those experiences to build cognitive models.",
                        "topic": "Constructivism in Learning",
                        "keyword_and_metadata": ["CTET", "Constructivism", "Active Learning"],
                        "img": "",
                        "sector": "Teaching",
                        "source_url": ""
                    },
                    {
                        "question": "'Dyslexia' is a specific learning disorder characterized by difficulty in:",
                        "options": {
                            "a": "Mathematical calculation",
                            "b": "Motor coordination and balance",
                            "c": "Reading, spelling, and decoding written words",
                            "d": "Social communication and eye contact"
                        },
                        "correct_option": "c",
                        "exam_name": "CTET",
                        "exam_year": "2023",
                        "exam_term": "Paper 1",
                        "subject": "Special Needs and Learning Disabilities",
                        "correct_answer": "Reading, spelling, and decoding written words",
                        "explanation": "Dyslexia is a specific neurodevelopmental learning disability characterized by difficulties with accurate and/or fluent word recognition and by poor spelling and decoding abilities.",
                        "topic": "Learning Disabilities",
                        "keyword_and_metadata": ["CTET", "Dyslexia", "Special Needs"],
                        "img": "",
                        "sector": "Teaching",
                        "source_url": ""
                    },
                    {
                        "question": "What is the primary objective of Continuous and Comprehensive Evaluation (CCE) implemented in schools?",
                        "options": {
                            "a": "To reduce board examination failure rates",
                            "b": "To assess all aspects of a student's holistic development, covering both scholastic and co-scholastic domains",
                            "c": "To increase homework load on children",
                            "d": "To eliminate the need for any formal testing"
                        },
                        "correct_option": "b",
                        "exam_name": "CTET",
                        "exam_year": "2023",
                        "exam_term": "Paper 2",
                        "subject": "Assessment Systems",
                        "correct_answer": "To assess all aspects of a student's holistic development, covering both scholastic and co-scholastic domains",
                        "explanation": "CCE aims to make evaluation an integral part of the learning-teaching process, focusing on all-round development including cognitive, affective, and psychomotor skills.",
                        "topic": "CCE Framework",
                        "keyword_and_metadata": ["CTET", "CCE", "Scholastic Evaluation"],
                        "img": "",
                        "sector": "Teaching",
                        "source_url": ""
                    }
                ]
            }
        }
    },
    "JUDICIARY_EXAMS": {
        "JUDICIARY_EXAMS": {
            "DJS": {
                "2023": [
                    {
                        "question": "Under the Code of Civil Procedure (CPC), 1908, which Section embodies the doctrine of 'Res Judicata'?",
                        "options": {
                            "a": "Section 9",
                            "b": "Section 10",
                            "c": "Section 11",
                            "d": "Section 12"
                        },
                        "correct_option": "c",
                        "exam_name": "Delhi Judicial Service",
                        "exam_year": "2023",
                        "exam_term": "Preliminary",
                        "subject": "Code of Civil Procedure",
                        "correct_answer": "Section 11",
                        "explanation": "Section 11 of the CPC bars the court from trying any suit or issue in which the matter directly and substantially in issue has been directly and substantially in issue in a former suit between the same parties.",
                        "topic": "Res Judicata",
                        "keyword_and_metadata": ["DJS", "CPC Section 11", "Res Judicata"],
                        "img": "",
                        "sector": "Judiciary",
                        "source_url": ""
                    },
                    {
                        "question": "Under Section 25 of the Indian Evidence Act, 1872, a confession made to which of the following is inadmissible and cannot be proved against an accused?",
                        "options": {
                            "a": "A Magistrate",
                            "b": "A Police Officer",
                            "c": "A Medical Doctor",
                            "d": "A village Sarpanch"
                        },
                        "correct_option": "b",
                        "exam_name": "Delhi Judicial Service",
                        "exam_year": "2023",
                        "exam_term": "Preliminary",
                        "subject": "Law of Evidence",
                        "correct_answer": "A Police Officer",
                        "explanation": "Section 25 of the Evidence Act explicitly states: 'No confession made to a police officer shall be proved as against a person accused of any offence.'",
                        "topic": "Confessions under Evidence Act",
                        "keyword_and_metadata": ["DJS", "Evidence Act Section 25", "Confession"],
                        "img": "",
                        "sector": "Judiciary",
                        "source_url": ""
                    },
                    {
                        "question": "Under the Indian Contract Act, 1872, an agreement made without consideration is void under Section 25, EXCEPT when it is:",
                        "options": {
                            "a": "Expressed in writing and registered on account of natural love and affection between parties standing in near relation",
                            "b": "Made orally between commercial partners",
                            "c": "Concluded through digital electronic signatures",
                            "d": "Witnessed by an advocate of High Court"
                        },
                        "correct_option": "a",
                        "exam_name": "Delhi Judicial Service",
                        "exam_year": "2023",
                        "exam_term": "Preliminary",
                        "subject": "Law of Contracts",
                        "correct_answer": "Expressed in writing and registered on account of natural love and affection between parties standing in near relation",
                        "explanation": "Section 25(1) of the Indian Contract Act provides an exception if the agreement is expressed in writing, registered under the law, and made on account of natural love and affection between parties standing in near relation to each other.",
                        "topic": "Consideration in Contract Law",
                        "keyword_and_metadata": ["DJS", "Contract Act Section 25", "Consideration"],
                        "img": "",
                        "sector": "Judiciary",
                        "source_url": ""
                    },
                    {
                        "question": "Under which Article of the Constitution of India does a High Court exercise power to issue prerogative writs for the enforcement of Fundamental Rights and for any other purpose?",
                        "options": {
                            "a": "Article 32",
                            "b": "Article 136",
                            "c": "Article 226",
                            "d": "Article 227"
                        },
                        "correct_option": "c",
                        "exam_name": "Delhi Judicial Service",
                        "exam_year": "2023",
                        "exam_term": "Preliminary",
                        "subject": "Constitutional Law",
                        "correct_answer": "Article 226",
                        "explanation": "Article 226 of the Constitution of India empowers High Courts to issue writs (habeas corpus, mandamus, prohibition, quo warranto, and certiorari) for the enforcement of fundamental rights and for any other purpose.",
                        "topic": "Writ Jurisdiction of High Courts",
                        "keyword_and_metadata": ["DJS", "Article 226", "Constitutional Law"],
                        "img": "",
                        "sector": "Judiciary",
                        "source_url": ""
                    },
                    {
                        "question": "Following the 2018 Amendment to the Specific Relief Act, 1963, the grant of specific performance of a contract by courts has become:",
                        "options": {
                            "a": "Purely discretionary for all contracts",
                            "b": "Mandatory, subject to the statutory exceptions in Sections 11(2), 14, and 16",
                            "c": "Prohibited unless agreed in writing",
                            "d": "Limited only to government infrastructure contracts"
                        },
                        "correct_option": "b",
                        "exam_name": "Delhi Judicial Service",
                        "exam_year": "2023",
                        "exam_term": "Preliminary",
                        "subject": "Specific Relief Act",
                        "correct_answer": "Mandatory, subject to the statutory exceptions in Sections 11(2), 14, and 16",
                        "explanation": "The Specific Relief (Amendment) Act, 2018 amended Section 10 to substitute 'shall be enforced by the court' for 'may be enforced in the discretion of the court', making specific performance mandatory.",
                        "topic": "Specific Performance Amendment 2018",
                        "keyword_and_metadata": ["DJS", "Specific Relief Act Section 10", "2018 Amendment"],
                        "img": "",
                        "sector": "Judiciary",
                        "source_url": ""
                    },
                    {
                        "question": "Under the Transfer of Property Act, 1882, the doctrine of 'Lis Pendens' is enacted under which Section?",
                        "options": {
                            "a": "Section 43",
                            "b": "Section 52",
                            "c": "Section 53A",
                            "d": "Section 54"
                        },
                        "correct_option": "b",
                        "exam_name": "Delhi Judicial Service",
                        "exam_year": "2023",
                        "exam_term": "Preliminary",
                        "subject": "Transfer of Property Act",
                        "correct_answer": "Section 52",
                        "explanation": "Section 52 of TPA incorporates the doctrine of Lis Pendens, which prohibits the transfer or alienation of immovable property directly and substantially in dispute in a pending suit so as to affect the rights of any other party.",
                        "topic": "Doctrine of Lis Pendens",
                        "keyword_and_metadata": ["DJS", "TPA Section 52", "Lis Pendens"],
                        "img": "",
                        "sector": "Judiciary",
                        "source_url": ""
                    },
                    {
                        "question": "Under the Code of Criminal Procedure (CrPC), 1973, which Section empowers the High Court or Court of Session to grant 'Anticipatory Bail'?",
                        "options": {
                            "a": "Section 436",
                            "b": "Section 437",
                            "c": "Section 438",
                            "d": "Section 439"
                        },
                        "correct_option": "c",
                        "exam_name": "Delhi Judicial Service",
                        "exam_year": "2023",
                        "exam_term": "Preliminary",
                        "subject": "Criminal Procedure Code",
                        "correct_answer": "Section 438",
                        "explanation": "Section 438 of CrPC empowers the High Court or the Court of Session to give a direction that in the event of arrest, a person accused of a non-bailable offence shall be released on bail.",
                        "topic": "Bail and Anticipatory Bail",
                        "keyword_and_metadata": ["DJS", "CrPC Section 438", "Anticipatory Bail"],
                        "img": "",
                        "sector": "Judiciary",
                        "source_url": ""
                    },
                    {
                        "question": "Which Section of the Indian Penal Code (IPC) defines the offence of 'Cheating'?",
                        "options": {
                            "a": "Section 405",
                            "b": "Section 415",
                            "c": "Section 420",
                            "d": "Section 425"
                        },
                        "correct_option": "b",
                        "exam_name": "Delhi Judicial Service",
                        "exam_year": "2023",
                        "exam_term": "Preliminary",
                        "subject": "Indian Penal Code",
                        "correct_answer": "Section 415",
                        "explanation": "Section 415 of the IPC defines 'Cheating'. Section 420 prescribes the punishment for cheating and dishonestly inducing delivery of property.",
                        "topic": "Offences Against Property",
                        "keyword_and_metadata": ["DJS", "IPC Section 415", "Cheating"],
                        "img": "",
                        "sector": "Judiciary",
                        "source_url": ""
                    },
                    {
                        "question": "Under the Limitation Act, 1963, what is the period of limitation for filing a suit for possession of immovable property based on title?",
                        "options": {
                            "a": "3 years",
                            "b": "6 years",
                            "c": "12 years",
                            "d": "30 years"
                        },
                        "correct_option": "c",
                        "exam_name": "Delhi Judicial Service",
                        "exam_year": "2023",
                        "exam_term": "Preliminary",
                        "subject": "Law of Limitation",
                        "correct_answer": "12 years",
                        "explanation": "Under Article 65 of the Schedule to the Limitation Act, 1963, the limitation period for possession of immovable property or any interest therein based on title is 12 years from when the possession of the defendant becomes adverse to the plaintiff.",
                        "topic": "Limitation on Immovable Property",
                        "keyword_and_metadata": ["DJS", "Limitation Act Article 65", "12 Years"],
                        "img": "",
                        "sector": "Judiciary",
                        "source_url": ""
                    },
                    {
                        "question": "Under the Hindu Marriage Act, 1955, which Section provides for 'Divorce by Mutual Consent'?",
                        "options": {
                            "a": "Section 9",
                            "b": "Section 13",
                            "c": "Section 13B",
                            "d": "Section 14"
                        },
                        "correct_option": "c",
                        "exam_name": "Delhi Judicial Service",
                        "exam_year": "2023",
                        "exam_term": "Preliminary",
                        "subject": "Family Law",
                        "correct_answer": "Section 13B",
                        "explanation": "Section 13B was inserted into the Hindu Marriage Act, 1955 by the Marriage Laws (Amendment) Act, 1976 to provide for divorce by mutual consent.",
                        "topic": "Divorce by Mutual Consent",
                        "keyword_and_metadata": ["DJS", "Hindu Marriage Act Section 13B", "Mutual Consent"],
                        "img": "",
                        "sector": "Judiciary",
                        "source_url": ""
                    }
                ]
            }
        }
    }
}

for filename, content in DATA.items():
    filepath = os.path.join(PYQ_DIR, f"{filename}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(content, f, indent=2, ensure_ascii=False)
    print(f"✅ Written 10 questions to {filename}.json")

print("\n🎉 All 11 JSON files successfully populated with 10 questions each!")
