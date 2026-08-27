with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad = '<div className={} />'
good = '<div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? "bg-[#005E6A]" : "bg-[#F15A24]"}`} />'

if bad in content:
    content = content.replace(bad, good, 1)
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed className successfully!")
else:
    print("bad not found")
