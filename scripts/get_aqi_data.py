from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
import time
import random
import requests
import os.path

CHROME_DRIVER_PATH = '/usr/local/bin/chromedriver'
DTA_START_URL = 'https://www.epa.gov/outdoor-air-quality-data/air-quality-index-daily-values-report'

no_ids = {"035", "049", "091", "115"}


def county_id_process():
    COUNTY_FIPS = {}
    f = open("../fire_data/st06_ca_cou.txt", "r")
    for line in f:
        code = line.strip().split(',')
        COUNTY_FIPS[code[2]] = code[3]
    return COUNTY_FIPS


def year_to_index():
    y_to_i = {}
    for i in range(10):
        y_to_i[2018 - i] = 2 + i
    return y_to_i


def rnd_wait(t):
    time.sleep(random.random() * random.random() * 3 + t)


def rnd_hold():
    time.sleep(random.random() * random.random() * 3 + 8)


def query(year, county_id, COUNTY_FIPS, y_to_i):
    print("Year: {}, County: {}, County_id: {}".format(year, COUNTY_FIPS[county_id], county_id))
    driver = webdriver.Chrome(CHROME_DRIVER_PATH)
    driver.get(DTA_START_URL)
    rnd_wait(1)
    res = fill_form(driver, y_to_i[year], "06{}".format(county_id))
    if not res:
        print(COUNTY_FIPS[county_id])
        driver.quit()
        return
    submit = driver.find_element_by_xpath('//*[@id="launch"]/input')
    submit.location_once_scrolled_into_view
    rnd_wait(1)
    actions = ActionChains(driver)
    actions.move_to_element(submit).click(submit).perform()
    rnd_hold()
    try:
        link = driver.find_element_by_xpath('//*[@id="results"]/p[2]/a[2]').get_attribute('href')
        path = ".//AQI_for_county/{}/{}_{}.csv".format(year, year, county_id)
        r = requests.get(link)
        if r.status_code == 200:
            with open(path, "wb") as f:
                f.write(r.content)
    except NoSuchElementException:
        print("Could not find the link.")
        with open('error.txt', 'a+') as outfile:
            outfile.write("{}, {}".format(year, county_id))
    driver.quit()


def download():
    COUNTY_FIPS = county_id_process()
    y_to_i = year_to_index()
    for year in y_to_i:
        for county_id in COUNTY_FIPS:
            if year > 2009 or year == 2009 and county_id < "059":
                continue
            # if county_id <= "069": continue
            query(year, county_id, COUNTY_FIPS, y_to_i)
    # query(2017, "023", COUNTY_FIPS, y_to_i)


def fill_form(driver, index, county):
    pollutant_select = Select(driver.find_element_by_css_selector('#poll'))
    pollutant_select.select_by_value("all")
    rnd_wait(5)
    try:
        year_select = Select(driver.find_element_by_css_selector('#year'))
        year_select.select_by_index(index)
        rnd_wait(5)
    except NoSuchElementException:
        print("hard to find data for county: {}".format(county))
        with open('error.txt', 'a+') as outfile:
            outfile.write("{}, {}\n".format(index, county))
        return False
    try:
        county_select = Select(driver.find_element_by_css_selector('#county'))
        county_select.select_by_value(county)
        rnd_wait(5)
        return True
    except NoSuchElementException:
        print("no data for county: {}".format(county))
        return False


def check_error():
    COUNTY_FIPS = county_id_process()
    y_to_i = year_to_index()
    for year in y_to_i:
        for county_id in COUNTY_FIPS:
            file_path = ".//AQI_for_county/{}/{}_{}.csv".format(year, year, county_id)
            if os.path.exists(file_path): continue
            # if county_id in no_ids: continue
            query(year, county_id, COUNTY_FIPS, y_to_i)


if __name__ == '__main__':
    #download()
    check_error()
    # year_to_index()
