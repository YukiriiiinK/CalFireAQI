import json
import csv
import os.path


months = ["01", "02", "03", "04",
          "05", "06", "07", "08",
          "09", "10", "11", "12"]

# top5 avg AQI, AQI, CO, Ozone, SO2, PM10, PM2.5, NO2



fields = ['Overall AQI Value', 'CO', 'Ozone', 'SO2', 'PM10', 'PM25', 'NO2']

COUNTY_FIPS = []
f = open("../fire_data/st06_ca_cou.txt", "r")
for line in f:
    code = line.strip().split(',')
    COUNTY_FIPS.append(code[2])


def process():
    daily_objects = {}
    for year in range(2009, 2019):
        for month in months:
            time = str(year) + month
            daily_objects[time] = {}
            for county_id in COUNTY_FIPS:
                daily_objects[time][county_id] = {}
                for field in fields:
                    field_cnt = '{}_cnt'.format(field)
                    daily_objects[time][county_id][field] = []
                    # daily_objects[time][county_id][field_cnt] = 0
    for year in range(2009, 2019):
        for county_id in COUNTY_FIPS:
            read(daily_objects, year, county_id)

    file_path = '../AQI_data/daily_objects.json'
    with open(file_path, 'w') as outfile:
        json.dump(daily_objects, outfile, indent=2)


def read(daily_objects, year, county_id):
    file_path = "../AQI_data/AQI_for_county/{}/{}_{}.csv".format(year, year, county_id)
    if not os.path.exists(file_path):
        print("no data for this county: {} in {}".format(county_id, year))
        return
    reader = csv.DictReader(open(file_path))

    for row in reader:
        month = row['Date'].split('/')[0]
        time = str(year) + month
        for field in fields:
            field_cnt = '{}_cnt'.format(field)
            index = row.get(field, None)
            if index is not None and index != '.':
                daily_objects[time][county_id][field].append(int(index))
                # daily_objects[time][county_id][field_cnt] += 1


def test(year, county_id):
    file_path = "../AQI_data/AQI_for_county/{}/{}_{}.csv".format(year, year, county_id)
    if not os.path.exists(file_path):
        print("no data for this county: {} in {}".format(county_id, year))
        return
    reader = csv.DictReader(open(file_path))

    for row in reader:
        month = row['Date'].split('/')[0]
        print(row['Date'])
        if row['Overall AQI Value']:
            AQI = int(row['Overall AQI Value'])
            print("AQI: {}".format(AQI))
            for pollutant in fields:
                index = row.get(pollutant, None)
                if index is not None:
                    print("{}: {}".format(pollutant, index))


def calculate():
    final_objects = {}
    file_path = '../AQI_data/daily_objects.json'
    with open(file_path) as f:
        daily_objects = json.load(f)
    for year in range(2009, 2019):
        for month in months:
            time = str(year) + month
            final_objects[time] = {}
            for county_id in COUNTY_FIPS:
                final_objects[time][county_id] = []
                if len(daily_objects[time][county_id][fields[0]]) == 0:
                    final_objects[time][county_id].append(-1)
                else:
                    num = 5
                    top = sorted(daily_objects[time][county_id][fields[0]], reverse=True)[:num]
                    final_objects[time][county_id].append(int(sum(top) / len(top)))
                for field in fields:
                    # field_cnt = '{}_cnt'.format(field)
                    field_cnt = len(daily_objects[time][county_id][field])
                    if field_cnt == 0:
                        final_objects[time][county_id].append(-1)
                    else:
                        value = sum(daily_objects[time][county_id][field]) / field_cnt
                        final_objects[time][county_id].append(int(value))

    file_path = '../AQI_data/AQI_for_county.json'
    with open(file_path, 'w') as outfile:
        json.dump(final_objects, outfile, indent=2)


if __name__ == '__main__':
    #process()
    calculate()
