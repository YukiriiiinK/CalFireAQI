import json


def county_id_process():
    FIPS_COUNTY = {}
    f = open("fire_data/st06_ca_cou.txt", "r")
    for line in f:
        code = line.strip().split(',')
        FIPS_COUNTY[code[2]] = code[3]
    return FIPS_COUNTY


def process(FIPS_COUNTY):
    with open('ca-counties-topo-500.json') as f:
        raw = json.load(f)
    for ele in raw['objects']['counties']['geometries']:
        ele['properties']['name'] = FIPS_COUNTY[ele['properties']['COUNTYFP']]
        ele['id'] = ele['properties']['COUNTYFP']
        print(ele['properties']['name'])
    with open('ca-counties-500.json', 'w') as outfile:
        json.dump(raw, outfile, indent=2)



if __name__ == '__main__':
    FIPS_COUNTY = county_id_process()
    # print(FIPS_COUNTY)
    process(FIPS_COUNTY)
