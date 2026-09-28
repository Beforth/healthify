import re

def read(p):
    return open(p, encoding='utf-8').read()

nut = read('src/data/nutritionData.ts')
foods = re.findall(r"^    id: '([^']+)'", nut, re.M)
cats = re.findall(r"^    category: '([^']+)'", nut, re.M)
pairs = dict(zip(foods, cats))

def keys(text, start):
    body = text.split(start, 1)[1]
    return set(re.findall(r"^  '?([a-z0-9-]+)'?:", body, re.M))

icons = keys(read('src/components/FoodIcon.tsx'), 'export const FOOD_ICONS')
micro = keys(read('src/game/micro/microStructures.ts'), 'export const MICRO')
flat = keys(read('src/game/micro/FlatCrossSection.tsx'), 'CrossSectionFact[]> = {')
reg = read('src/game/food3d/foodRegistry.tsx')
models = keys(reg, 'FOOD_MODELS')
xsec = keys(reg, 'FOOD_CROSS_SECTIONS')

healthy = sum(1 for c in pairs.values() if c == 'healthy')
junk = sum(1 for c in pairs.values() if c == 'junk')
print('foods: %d  (healthy %d / junk %d)' % (len(foods), healthy, junk))

bad = False
for f in foods:
    problems = []
    if f not in icons:
        problems.append('NO ICON')
    if f not in micro:
        problems.append('NO MICRO')
    if f in models and f not in xsec:
        problems.append('MODEL BUT NO CROSS-SECTION')
    if f not in models and f not in flat:
        problems.append('NO 3D AND NO FLAT FACTS')
    if problems:
        bad = True
        print('  %-16s -> %s' % (f, ', '.join(problems)))

print('orphan models:', sorted(models - set(foods)) or 'none')
print('orphan micro :', sorted(micro - set(foods)) or 'none')
print('orphan flat  :', sorted(flat - set(foods)) or 'none')
print('3D foods:', sorted(models))
print('PROBLEMS ABOVE' if bad else 'ALL WIRED')
