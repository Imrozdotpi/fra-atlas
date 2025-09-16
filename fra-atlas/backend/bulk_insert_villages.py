# backend/bulk_insert_villages.py
import requests

API_BASE = "http://127.0.0.1:8000"  # change if your backend runs elsewhere
URL = f"{API_BASE}/api/villages"    # <<-- note the /api prefix

payloads = [
    {"state":"Madhya Pradesh","district":"Shivpuri","block":None,"village":"Kailashpur","lat":25.4300,"lon":77.6500},
    {"state":"Madhya Pradesh","district":"Shivpuri","block":None,"village":"Rampur","lat":25.3500,"lon":77.8000},
    {"state":"Madhya Pradesh","district":"Chhindwara","block":None,"village":"Chhoti Bari","lat":22.0600,"lon":79.1800},
    {"state":"Madhya Pradesh","district":"Chhindwara","block":None,"village":"Beldih","lat":22.2000,"lon":79.1500},
    {"state":"Odisha","district":"Koraput","block":None,"village":"Koraput Basti","lat":18.8200,"lon":82.7300},
    {"state":"Odisha","district":"Koraput","block":None,"village":"Lamtapalli","lat":18.9000,"lon":82.6500},
    {"state":"Odisha","district":"Kandhamal","block":None,"village":"Kandha Tola","lat":20.4700,"lon":84.0200},
    {"state":"Odisha","district":"Kandhamal","block":None,"village":"Daringbadi","lat":20.3500,"lon":84.0300},
    {"state":"Telangana","district":"Warangal","block":None,"village":"Warangal Cheruvu","lat":17.9800,"lon":79.5800},
    {"state":"Telangana","district":"Warangal","block":None,"village":"Narsampet","lat":17.4300,"lon":79.7300},
    {"state":"Telangana","district":"Adilabad","block":None,"village":"Adilabad Peta","lat":19.6500,"lon":78.5300},
    {"state":"Telangana","district":"Adilabad","block":None,"village":"Sirpur","lat":19.4500,"lon":78.4800},
    {"state":"Tripura","district":"West","block":None,"village":"Agartala West End","lat":23.8300,"lon":91.2800},
    {"state":"Tripura","district":"West","block":None,"village":"Sadar Bazar","lat":23.8200,"lon":91.2800},
]

def main():
    for p in payloads:
        # remove None block to avoid sending null if backend doesn't accept null
        payload = {k: v for k, v in p.items() if v is not None}
        try:
            r = requests.post(URL, json=payload, timeout=10)
            if r.status_code in (200, 201):
                print(f"Inserted: {payload['village']}")
            else:
                print(f"Failed: {payload['village']} -> {r.status_code} {r.text}")
        except Exception as e:
            print(f"Exception for {payload['village']}: {e}")

if __name__ == "__main__":
    main()
