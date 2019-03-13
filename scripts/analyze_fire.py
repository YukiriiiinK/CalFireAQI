import json

with open("../fire_data/fire_data.json") as f:
    data = json.load(f)
    dps = [dp for ym in data.values() for dp in ym.values() ]

print(dps)
print(max(dps))
print(len(dps))

thresholds = (1, 50, 100, 200, 500, 1000, 4000, 10000, 50000)
print(f'num thres: {len(thresholds)}')

for threshold in thresholds:
    print(f'Threshold: {threshold}, count {len([d for d in dps if d > threshold])}')

"""
1, 10, 100, 1000, 10000, 100000, 100000
0,      1,      2,      3,       4,         5,      6,      7,      8,      9,      10
                                                                                100000
"""
