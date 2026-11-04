"""Export the original portfolio's public articles for this static portfolio.

Usage: python3 tools/export_public_posts.py ../cedrai-portfolio-source
"""
import html
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('../cedrai-portfolio-source')
ALLOWED = {'div','p','span','b','strong','i','em','s','h2','h3','h4','hr','br','figure','figcaption','pre','code','table','tbody','tr','td','th','ul','ol','li','blockquote','a','img'}
VOID = {'hr','br','img'}
MEDIA_PREFIX = 'https://www.cedrai.info/blog-content/media/'

class Cleaner(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script','style','iframe'):
            self.skip += 1
            return
        if self.skip or tag not in ALLOWED:
            return
        attr = dict(attrs)
        output = []
        if tag == 'img':
            match = re.fullmatch(r'\./content/media/([A-Za-z0-9_.-]+)', attr.get('src',''))
            if not match:
                return
            output += [('src', MEDIA_PREFIX + match.group(1)), ('alt', attr.get('alt') or '블로그 글 이미지'), ('loading','lazy')]
        elif tag == 'a':
            href = attr.get('href','')
            parsed = urlparse(href)
            if parsed.scheme not in ('http','https','mailto') and not href.startswith('#'):
                href = '#'
            output += [('href',href), ('rel','noopener noreferrer')]
        elif tag in ('pre','code') and re.fullmatch(r'[\w -]{1,60}', attr.get('class','')):
            output.append(('class',attr['class']))
        elif tag in ('td','th'):
            for name in ('colspan','rowspan'):
                if attr.get(name,'').isdigit() and int(attr[name]) <= 10:
                    output.append((name,attr[name]))
        attributes = ''.join(f' {name}="{html.escape(value, quote=True)}"' for name,value in output)
        self.parts.append(f'<{tag}{attributes}>')
    def handle_endtag(self, tag):
        if tag in ('script','style','iframe'):
            self.skip = max(0,self.skip-1)
        elif not self.skip and tag in ALLOWED and tag not in VOID:
            self.parts.append(f'</{tag}>')
    def handle_data(self, data):
        if not self.skip:
            self.parts.append(html.escape(data))
    def handle_entityref(self, name):
        self.handle_data(html.unescape('&'+name+';'))
    def handle_charref(self, name):
        self.handle_data(html.unescape('&#'+name+';'))
    def clean(self, value):
        self.feed(value)
        return ''.join(self.parts)

catalog = json.loads((SOURCE/'data/blog-catalog.json').read_text())['posts']
posts = []
for post in catalog:
    if post.get('protected'):
        continue
    file = SOURCE/'public/blog-content/posts'/f"{post['slug']}.json"
    if not file.exists():
        continue
    article = json.loads(file.read_text())
    if article.get('visibility') != 'public':
        continue
    posts.append({
        'slug': post['slug'], 'title': post['title'], 'category': post['category'],
        'date': post['date'], 'summary': post.get('summary',''),
        'contentHtml': Cleaner().clean(article['content']),
    })
Path('posts.json').write_text(json.dumps(posts, ensure_ascii=False, separators=(',',':')))
print(f'Exported {len(posts)} public posts')
