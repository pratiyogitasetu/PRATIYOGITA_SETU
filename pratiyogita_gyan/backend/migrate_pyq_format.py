import os
import json
import glob
import re
from collections import OrderedDict

PYQ_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'DATA', 'pyq')
BACKUP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'DATA', 'pyq_backup')

def clean_text(s):
    if not isinstance(s, str):
        return ''
    s = s.replace('\ufffd', '').replace('', '')
    s = re.sub(r'[\r\n\t]+', ' ', s)
    s = re.sub(r'\s{2,}', ' ', s)
    return s.strip()

def strip_leading_num(txt):
    return re.sub(r'^\s*\d+[\.\)]\s+', '', txt).strip()

def check_negative(txt):
    return bool(re.search(r'\b(not\s+correct|not\s+true|incorrect|not\s+matched|false)\b', txt, re.IGNORECASE))

def clean_item(it):
    it = it.strip().lstrip(':').strip().rstrip('.,;').strip()
    return it

def extract_items(s):
    s = s.strip().lstrip(':').strip().rstrip('.').strip()
    if re.search(r'\b[A-E]\.[\s\xa0]*', s):
        res = [clean_item(x) for x in re.split(r'(?=\b[A-E]\.[\s\xa0]*)', s) if x.strip()]
    elif re.search(r'\b[1-9]\.[\s\xa0]*', s):
        res = [clean_item(x) for x in re.split(r'(?=\b[1-9]\.[\s\xa0]*)', s) if x.strip()]
    elif ';' in s:
        res = [clean_item(x) for x in s.split(';') if x.strip()]
    elif ',' in s:
        res = [clean_item(x) for x in s.split(',') if x.strip()]
    else:
        res = [clean_item(s)]
    return [x for x in res if x]

def parse_match_list(txt, is_neg):
    l1_matches = list(re.finditer(r'List\s*[-–—]?\s*(?:I|1|IT)\b', txt, re.IGNORECASE))
    l2_matches = list(re.finditer(r'List\s*[-–—]?\s*(?:II|2|IIT)\b', txt, re.IGNORECASE))
    if not l1_matches or not l2_matches:
        return None
        
    l1_start_match = l1_matches[1] if (len(l1_matches) > 1 and l1_matches[0].start() < 80 and re.search(r'match\s+list', txt[:80], re.IGNORECASE)) else l1_matches[0]
    l2_start_match = next((m for m in l2_matches if m.start() > l1_start_match.end()), None)
    if not l2_start_match:
        return None
        
    intro = txt[:l1_start_match.start()].strip().rstrip(':').strip()
    if not intro:
        intro = 'Match List-I with List-II and select the answer using the codes given below the Lists:'
        
    l1_raw = txt[l1_start_match.end():l2_start_match.start()].strip()
    after_l2 = txt[l2_start_match.end():].strip()
    
    m_cutoff = re.search(r'(List\s*[-–—]?\s*(?:I|1)\b|Codes?[\s:]+)', after_l2, re.IGNORECASE)
    l2_raw = after_l2[:m_cutoff.start()].strip() if m_cutoff else after_l2.strip()
    
    def split_title_items(s, default_title):
        s = s.strip()
        title = default_title
        items_str = s
        if s.startswith('('):
            m = re.match(r'^\((.*?)\)[:\s]*(.*)', s, re.DOTALL)
            if m:
                title = f'{default_title} ({m.group(1).strip()})'
                items_str = m.group(2).strip()
        elif s.startswith(':'):
            items_str = s.lstrip(':').strip()
        elif ':' in s[:50]:
            parts = s.split(':', 1)
            t = parts[0].strip()
            if t and not re.search(r'\b[A-E1-9]\.', t):
                title = f'{default_title} ({t})'
                items_str = parts[1].strip()
        return title, items_str

    l1_title, l1_items_str = split_title_items(l1_raw, 'List-I')
    l2_title, l2_items_str = split_title_items(l2_raw, 'List-II')

    l1 = extract_items(l1_items_str)
    l2 = extract_items(l2_items_str)
    
    if len(l1) >= 2 and len(l2) >= 2:
        return {
            'question_type': 'match_list',
            'question': intro,
            'directive': 'Select the correct answer using the code given below:',
            'statements': [],
            'match_data': {
                'list_1_title': l1_title,
                'list_1': l1,
                'list_2_title': l2_title,
                'list_2': l2
            },
            'assertion_reason': None,
            'is_negative': is_neg
        }
    return None

def parse_assertion_reason(txt, is_neg):
    m_ar = re.search(r'Assertion\s*\([A-Za-z]\)[:\s]+(.*?)\s*Reason\s*\([A-Za-z]\)[:\s]+(.*)', txt, re.IGNORECASE | re.DOTALL)
    if m_ar:
        return {
            'question_type': 'assertion_reason',
            'question': 'Given below are two statements, one labeled as Assertion (A) and the other as Reason (R):',
            'directive': 'Select the correct answer using the codes given below:',
            'statements': [],
            'match_data': None,
            'assertion_reason': {
                'assertion': m_ar.group(1).strip(),
                'reason': m_ar.group(2).strip()
            },
            'is_negative': is_neg
        }
        
    m_s12 = re.search(r'Statement\s*[-–—]?\s*I[:\s]+(.*?)\s*Statement\s*[-–—]?\s*II[:\s]+(.*)', txt, re.IGNORECASE | re.DOTALL)
    if m_s12:
        return {
            'question_type': 'assertion_reason',
            'question': 'Examine the following two statements carefully and select the correct answer:',
            'directive': 'Select the correct answer using the codes given below:',
            'statements': [],
            'match_data': None,
            'assertion_reason': {
                'assertion': 'Statement I: ' + m_s12.group(1).strip(),
                'reason': 'Statement II: ' + m_s12.group(2).strip()
            },
            'is_negative': is_neg
        }
    return None

def parse_multi_statement(txt, is_neg):
    directive_patterns = [
        r'(Which of the statements? given above is/are(?:\s+not)?\s+correct\??)',
        r'(Which of the statements? given above are correct\??)',
        r'(Which of the above statements? is/are(?:\s+not)?\s+correct\??)',
        r'(Which of the above statements? are correct\??)',
        r'(Which of the following statements? is/are(?:\s+not)?\s+correct\??)',
        r'(Which of the statements? is/are(?:\s+not)?\s+correct\??)',
        r'(Select the correct answer using the codes? given below:?)',
        r'(Choose the correct answer using the codes? given below:?)',
        r'(Which of the pairs? given above is/are(?:\s+not)?\s+correctly matched\??)'
    ]
    
    directive = ''
    body = txt
    for pat in directive_patterns:
        m_dir = re.search(pat, body, flags=re.IGNORECASE)
        if m_dir:
            directive = m_dir.group(1).strip()
            body = body[:m_dir.start()].strip()
            break
            
    m_start = re.search(r'(?:^|\s)(?:1[\.\)]|\(1\))\s+', body)
    if not m_start:
        m_start = re.search(r'(?:^|\s)(?:I[\.\)]|\(I\))\s+', body)
        if m_start:
            lead_in = body[:m_start.start()].strip()
            stmts_part = body[m_start.start():].strip()
            items = [x.strip() for x in re.split(r'(?=(?:^|\s)(?:I{1,3}|IV|V|VI)[\.\)])', stmts_part) if x.strip()]
        else:
            items = []
    else:
        lead_in = body[:m_start.start()].strip()
        stmts_part = body[m_start.start():].strip()
        items = [x.strip() for x in re.split(r'(?=(?:^|\s)\d+[\.\)])', stmts_part) if x.strip()]

    if len(items) >= 2:
        if not directive:
            directive = 'Which of the statements given above is/are not correct?' if is_neg else 'Which of the statements given above is/are correct?'
        return {
            'question_type': 'multi_statement',
            'question': lead_in if lead_in else 'Consider the following statements:',
            'directive': directive,
            'statements': items,
            'match_data': None,
            'assertion_reason': None,
            'is_negative': is_neg
        }
    return None

def convert_question(q_raw, idx, exam_name, exam_year, exam_term, default_sector):
    raw_text = clean_text(q_raw.get('question', ''))
    txt = strip_leading_num(raw_text)
    is_neg = check_negative(txt)
    
    # 1. Try Match List
    res = parse_match_list(txt, is_neg)
    
    # 2. Try Assertion / Reason
    if not res:
        res = parse_assertion_reason(txt, is_neg)
        
    # 3. Try Multi-Statement
    if not res:
        res = parse_multi_statement(txt, is_neg)
        
    # 4. Fallback: Single Choice
    if not res:
        txt_clean = re.sub(r'[\.\s]*Select the correct answer using the codes? given below:?$', '', txt, flags=re.IGNORECASE).strip()
        res = {
            'question_type': 'single_choice',
            'question': txt_clean,
            'directive': '',
            'statements': [],
            'match_data': None,
            'assertion_reason': None,
            'is_negative': is_neg
        }

    # Format term for ID
    term_str = str(exam_term).strip().upper()
    if term_str == '1':
        term_str = 'I'
    elif term_str == '2':
        term_str = 'II'
    elif not term_str:
        term_str = 'I'

    q_id = f"{exam_name}_{exam_year}_{term_str}_Q{idx+1:03d}"

    # Standardize options
    opts_in = q_raw.get('options', {})
    std_options = OrderedDict([('a', ''), ('b', ''), ('c', ''), ('d', '')])
    if isinstance(opts_in, dict):
        for k in ['a', 'b', 'c', 'd']:
            val = opts_in.get(k) or opts_in.get(k.upper(), '')
            std_options[k] = clean_text(str(val))
    elif isinstance(opts_in, list):
        keys = ['a', 'b', 'c', 'd']
        for i, val in enumerate(opts_in[:4]):
            std_options[keys[i]] = clean_text(str(val))

    correct_opt = clean_text(str(q_raw.get('correct_option', ''))).lower()
    if correct_opt not in ['a', 'b', 'c', 'd']:
        correct_opt = 'a'

    correct_ans = clean_text(str(q_raw.get('correct_answer', '')))
    if not correct_ans and correct_opt in std_options:
        correct_ans = std_options[correct_opt]

    # Image
    img_val = clean_text(str(q_raw.get('image_url') or q_raw.get('img') or ''))

    # Keywords
    kws = q_raw.get('keywords') or q_raw.get('keyword_and_metadata') or []
    if isinstance(kws, str):
        kws = [x.strip() for x in kws.split(',') if x.strip()]
    elif not isinstance(kws, list):
        kws = []
    kws = [clean_text(str(x)) for x in kws if str(x).strip()]

    # Construct the canonical standardized question object with exact keys
    item_out = OrderedDict([
        ("id", q_id),
        ("question_type", res['question_type']),
        ("exam_name", exam_name),
        ("exam_year", str(exam_year)),
        ("exam_term", term_str),
        ("subject", clean_text(q_raw.get('subject', ''))),
        ("topic", clean_text(q_raw.get('topic', ''))),
        ("subtopic", clean_text(q_raw.get('subtopic', ''))),
        ("difficulty", clean_text(q_raw.get('difficulty', 'medium')) or 'medium'),
        ("is_negative", res['is_negative']),

        ("question", res['question']),
        ("directive", res['directive']),
        ("passage", clean_text(q_raw.get('passage', ''))),

        ("statements", res['statements']),
        ("match_data", res['match_data']),
        ("assertion_reason", res['assertion_reason']),

        ("options", std_options),
        ("correct_option", correct_opt),
        ("correct_answer", correct_ans),
        ("explanation", clean_text(q_raw.get('explanation', ''))),

        ("image_url", img_val),
        ("keywords", kws),
        ("sector", clean_text(q_raw.get('sector', '')) or default_sector),
        ("source_url", clean_text(q_raw.get('source_url', '')))
    ])
    return item_out

def main():
    print("Starting PYQ Master Migration...")
    files = glob.glob(os.path.join(PYQ_DIR, '*.json'))
    total_processed = 0

    category_to_sector = {
        'DEFENCE_EXAMS': 'Defence',
        'CIVIL_SERVICES_EXAMS': 'Civil Services',
        'SSC_EXAMS': 'SSC & Staff Selection',
        'BANKING_EXAMS': 'Banking & Insurance',
        'RAILWAY_EXAMS': 'Railways',
        'POLICE_EXAMS': 'Police & Paramilitary',
        'TEACHING_EXAMS': 'Teaching & TET',
        'ENGINEERING_RECRUITING_EXAMS': 'Engineering & GATE',
        'JUDICIARY_EXAMS': 'Judiciary & Law',
        'MBA_EXAMS': 'MBA & Management',
        'CUET_AND_UG_ENTRANCE_EXAMS': 'Undergraduate Entrance',
        'PG_EXAMS': 'Postgraduate Entrance'
    }

    for fpath in files:
        fname = os.path.basename(fpath)
        with open(fpath, 'r', encoding='utf-8') as fp:
            data = json.load(fp)

        file_q_count = 0
        cat_key = list(data.keys())[0] if isinstance(data, dict) else 'GENERAL'
        sector = category_to_sector.get(cat_key, 'General Competitive')

        if isinstance(data, dict):
            for cat_k, exams in data.items():
                if isinstance(exams, dict):
                    for ex_name, years in exams.items():
                        if isinstance(years, dict):
                            for yr_key, q_list in years.items():
                                if isinstance(q_list, list):
                                    # Split year and term if yr_key is e.g. '2026_1'
                                    yr_val = yr_key
                                    term_val = ''
                                    if '_' in yr_key:
                                        parts = yr_key.split('_')
                                        yr_val = parts[0]
                                        term_val = 'I' if parts[1] == '1' else 'II' if parts[1] == '2' else parts[1]
                                    
                                    new_qs = []
                                    for idx, q in enumerate(q_list):
                                        q_term = q.get('exam_term') or term_val
                                        q_yr = q.get('exam_year') or yr_val
                                        q_ex = q.get('exam_name') or ex_name
                                        converted = convert_question(q, idx, q_ex, q_yr, q_term, sector)
                                        new_qs.append(converted)
                                        file_q_count += 1
                                        total_processed += 1
                                    years[yr_key] = new_qs

        # Save back to file with proper indent
        with open(fpath, 'w', encoding='utf-8') as fp:
            json.dump(data, fp, indent=2, ensure_ascii=False)

        print(f"Updated {fname}: {file_q_count} questions converted.")

    print(f"\nMigration completed successfully! Total questions converted: {total_processed}")

if __name__ == '__main__':
    main()
