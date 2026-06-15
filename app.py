from flask import Flask, render_template, jsonify
import urllib.request
import xml.etree.ElementTree as ET
import re
import html

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        ns = {'ns': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('ns:entry', ns):
            title_elem = entry.find('ns:title', ns)
            date_str = title_elem.text if title_elem is not None else "Unknown Date"
            
            updated_elem = entry.find('ns:updated', ns)
            updated_str = updated_elem.text if updated_elem is not None else ""
            
            link_elem = entry.find('ns:link', ns)
            link = link_elem.get('href') if link_elem is not None else ""
            
            content_elem = entry.find('ns:content', ns)
            content_html = content_elem.text if content_elem is not None else ""
            
            # Extract individual updates grouped under this entry
            # The structure in feed content is typically <h3>Heading</h3> <p>Content</p>
            updates = []
            matches = re.findall(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', content_html, re.DOTALL)
            
            if matches:
                for idx, (heading, text) in enumerate(matches):
                    # Strip out trailing/leading whitespaces
                    heading_cleaned = heading.strip()
                    text_cleaned = text.strip()
                    
                    # Compute a clean text representation (remove html tags) for tweet/search
                    clean_text = re.sub(r'<[^>]+>', '', text_cleaned)
                    clean_text = html.unescape(clean_text)
                    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
                    
                    updates.append({
                        'id': f"{date_str.replace(' ', '_')}_{idx}",
                        'type': heading_cleaned,
                        'body': text_cleaned,
                        'plain_text': clean_text
                    })
            else:
                # Fallback if no <h3> tag is found
                clean_text = re.sub(r'<[^>]+>', '', content_html)
                clean_text = html.unescape(clean_text)
                clean_text = re.sub(r'\s+', ' ', clean_text).strip()
                
                updates.append({
                    'id': f"{date_str.replace(' ', '_')}_0",
                    'type': 'Update',
                    'body': content_html.strip(),
                    'plain_text': clean_text
                })
                
            entries.append({
                'date': date_str,
                'updated': updated_str,
                'link': link,
                'updates': updates
            })
            
        return {'success': True, 'data': entries}
    except Exception as e:
        return {'success': False, 'error': str(e)}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    result = fetch_and_parse_feed()
    if result['success']:
        return jsonify(result['data'])
    else:
        return jsonify({'error': result['error']}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
