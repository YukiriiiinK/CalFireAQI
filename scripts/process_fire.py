import json
import re

Month_to_Number = {
    'January': '01',
    'February': '02',
    'March': '03',
    'April': '04',
    'May': '05',
    'June': '06',
    'July': '07',
    'August': '08',
    'September': '09',
    'October': '10',
    'November': '11',
    'December': '12'
}


def county_id_process():
    COUNTY_FIPS = {}
    f = open("st06_ca_cou.txt", "r")
    for line in f:
        code = line.strip().split(',')
        COUNTY_FIPS[code[3].replace(' County', '')] = code[2]
    return COUNTY_FIPS


def process(COUNTY_FIPS):
    records = []
    other_records = []
    with open('other_records.json') as f:
        raw = json.load(f)
        print(len(raw))
        for incident in raw:
            id = incident['incident_id']
            time = incident['time']
            detail = incident['detail']
            county = incident['county']
            counties = re.split('and | & | ,', county)
            slots = re.split(',| ', time)
            if slots[0] not in Month_to_Number:
                incident['reason'] = "Time"
                other_records.append(incident)
                continue
            else:
                time_n = slots[3] + Month_to_Number[slots[0]]
            loc = detail.find('acres')
            if loc < 0:
                loc = detail.find('Acres')
            if loc > 0:
                acres = float(detail[:loc].split()[-1].replace(',', ''))
            else:
                incident['reason'] = "Acres"
                other_records.append(incident)
                continue
            for c in counties:
                word = c.replace("County", "").strip()
                if word.strip() in COUNTY_FIPS:
                    record = dict()
                    record['incident_id'] = id
                    record['time'] = time_n
                    record['county'] = word.strip()
                    record['county_id'] = COUNTY_FIPS[word.strip()]
                    record['acres'] = acres
                    records.append(record)
                else:
                    incident['reason'] = "County"
                    other_records.append(incident)
    print(len(records))
    with open('fire_records_2.json', 'w') as outfile:
        json.dump(records, outfile, indent=2)
    with open('other_records_2.json', 'w') as outfile2:
        json.dump(other_records, outfile2, indent=2)


def merge():
    with open('fire_records.json') as f:
        raw = json.load(f)
        print(len(raw))
    with open('fire_records_2.json') as f:
        raw_2 = json.load(f)
        print(len(raw_2))
    for record in raw:
        for record_2 in raw_2:
            if record['incident_id'] == record_2['incident_id'] and record['county_id'] == record_2['county_id']:
                raw_2.remove(record_2)
    print(len(raw_2))
    raw.extend(raw_2)
    print(len(raw))
    newlist = sorted(raw, key=lambda k: k['incident_id'])
    with open('all_records.json', 'w') as outfile:
        json.dump(newlist, outfile, indent=2)


def calculate(COUNTY_FIPS):
    result = {}
    with open('all_records.json') as f:
        records = json.load(f)
    print(len(records))
    months = ["01", "02", "03", "04",
             "05", "06", "07", "08",
             "09", "10", "11", "12"]
    for year in range(2008, 2019):
        for month in months:
            time = str(year) + month
            result[time] = {}
            for county, id in COUNTY_FIPS.items():
                result[time][id] = 0.0
    for record in records:
        time = record['time']
        county_id = record['county_id']
        result[time][county_id] += record['acres']
    with open('fire_data.json', 'w') as outfile:
        json.dump(result, outfile, indent=2)


if __name__ == '__main__':
    COUNTY_FIPS = county_id_process()
    #print(COUNTY_FIPS)
    #process(COUNTY_FIPS)
    #merge()
    calculate(COUNTY_FIPS)
