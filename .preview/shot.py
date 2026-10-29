from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,w,h,scheme in [('desk',1200,900,'light'),('phone',390,844,'dark')]:
        pg=b.new_page(viewport={'width':w,'height':h},color_scheme=scheme)
        errs=[]; pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None); pg.on('pageerror',lambda e: errs.append(str(e)))
        pg.goto('http://localhost:5174/'); pg.wait_for_timeout(1500)
        pg.screenshot(path=f'/tmp/claude-0/-home-claude/1ac298a1-6439-5b0c-b60d-17c3d59a45a1/scratchpad/{name}.png',full_page=True)
        print(name,errs)
    b.close()
