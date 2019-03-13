import requests
import json
from bs4 import BeautifulSoup


def send_request():
    others = []
    raw_info = []
    URL = 'http://cdfdata.fire.ca.gov/incidents/incidents_details_info'
    # range(250, 2292)
    for incident_id in range(250, 2292):
        params = {
            'incident_id': incident_id
        }
        r = requests.get(URL, params)
    # print(r.status_code)
    # print(r.text)
        soup = BeautifulSoup(r.text, "html.parser")
        data = soup.find('table', "incident_table")
        if not data:
            # print("no data")
            continue
        table = data.findAll('tr')
        # if not table:
        incident = dict()
        incident['incident_id'] = incident_id
        for rows in table:
            cols = rows.findAll('td')
            if len(cols) == 1:
                # print(cols[0].get_text())
                incident['info'] = cols[0].get_text().strip()
            if cols[0].get_text() == 'Date/Time Started: ':
                # print(cols[1].get_text())
                incident['time'] = cols[1].get_text().strip()
            if cols[0].get_text() == 'County:':
                # print(cols[1].get_text())
                incident['county'] = cols[1].get_text().strip()
            if 'Containment' in cols[0].get_text() or 'containment' in cols[0].get_text():
                # print(cols[1].get_text())
                incident['detail'] = cols[1].get_text().strip()
        if len(incident) == 5:
            raw_info.append(incident)
        else:
            others.append(incident_id)
    with open('raw_info.json', 'w') as outfile:
        json.dump(raw_info, outfile, indent=2)
    with open('other_incident.json', 'w') as outfile:
        json.dump(others, outfile, indent=2)


if __name__ == '__main__':
    send_request()
