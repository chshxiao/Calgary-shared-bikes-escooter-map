import pandas as pd
import requests
from io import StringIO


def main():

    # request the data from neuron free bike status path
    res = requests.get("https://mds-global-yyc.neuron-mobility.com/gbfs/2/en/free_bike_status")
    raw_data = res.json()

    # write data to a csv file
    data = raw_data["data"]["bikes"]
    pd_data = pd.json_normalize(data)
    pd_data.to_csv('neuron_free_bikes.csv')


if __name__ == "__main__":
    main()