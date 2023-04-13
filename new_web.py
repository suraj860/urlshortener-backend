import pandas as pd
import numpy as np
import json
from scipy.stats import ttest_rel
from csv import writer
from geopy.geocoders import Nominatim
import sys
import ast

# Session Data
session_data_path = "dummy_data.csv"
# user_name = "Pavan"
# current_session_data = ["user_pavan_test1_device2","Windows","58.28.42.58","KA07519","17.399041150352776", "78.4746642107445"]

user_name = sys.argv[1]
current_session_data = ast.literal_eval(sys.argv[2])

# Keystroke Data
keystroke_data_path = "keystroke_dummy.csv"
user_input_time = [0,95,168,265,360,455,527,599,736,807,928,999,1024,1095,1215,1271,1423,1471,1664,1711,1880,1952,2039,2111, 2231, 2279]
tolerance = 0.99

# print(len(user_input_time))
# Session Authentication
def get_city(latitude, longitude):
	geolocator = Nominatim(user_agent="geoapiExercises")
	location = geolocator.reverse(latitude+","+longitude)
	address = location.raw['address']
	city = address['city']
	return city
def compute_prob(val, d):
  freq = d.value_counts()[val]
  return freq/(len(d))

def session_score(data, current_session_data):
  d = []
  mask = (data['DeviceID']==current_session_data[0]) & (data['OS_version']==current_session_data[1]) & (data['IP']==current_session_data[2]) & (data['AppID']==current_session_data[3]) & (data['Location']==current_session_data[4])
  prob = data[mask].drop_duplicates()
  sc = prob['Prob_Not_genuine'].tolist()[0]
  for f in data.columns[5:-2]:
    name = f
    value = prob[f].tolist()[0]

    d.append({'name': name, 'value': value})
  d.append({"Session_Score": sc})
  return d

def authenticate_user_session(data_path, user_name, current_session_data):
  city = get_city(current_session_data[-2], current_session_data[-1])
  current_session_data = current_session_data[0:-2] + [city]
  data = pd.read_csv(data_path)
  if user_name not in data['user_name'].to_list():
    return f'Our database have no data of {user_name}'
  elif len(data[data['user_name']==user_name]) < 20:
    return f"We don't have enough data of {user_name} for training"
  

  data = data[data['user_name'] == user_name]
  data = data.drop(columns=['user_name'])

  data["IP_loc"] = [str(i)+str(j) for i, j in zip(data['IP'],data['Location'])]
  data["DeviceID_OS_version_IP_AppID"] = data["DeviceID"]	+ data["OS_version"] + data["IP"] + data["AppID"]
  features = list(data.columns)
  
  for feature in features:
    data["P_"+feature] = data[feature].apply(compute_prob, d=data[feature])

  data["CP_loc_IP"] = data["P_IP_loc"] / data["P_IP"]
  data["DeviceID_OS_version_IP_AppID"] = data["DeviceID"]	+ data["OS_version"] + data["IP"] + data["AppID"]
  data["Prob_Not_genuine"] = 1 - (data["P_DeviceID_OS_version_IP_AppID"] + data["CP_loc_IP"] - data["P_DeviceID_OS_version_IP_AppID"] * data["CP_loc_IP"])
  
  data = data.drop(columns=['IP_loc', 'P_IP_loc', 'DeviceID_OS_version_IP_AppID', 'P_DeviceID_OS_version_IP_AppID'])
  sc = session_score(data, current_session_data)
  
  return sc


# s = authenticate_user_session(data_path, user_name, current_session_data)
# print(s)


# Keystroke  
def update_file(data_path, name, user_input_time):
  add_data = []
  add_data.append(name)
  add_data.extend(user_input_time)
  with open(data_path, 'a') as f_object:
    writer_object = writer(f_object)
    # f_object.write("\n")
    writer_object.writerow(add_data)
   
    # Close the file object
    f_object.close()

def authenticate_user(data_path, user_name, user_input_time, tolerance):
  
  data = pd.read_csv(data_path)
  # print(data.shape)
  if user_name not in data['user_name'].to_list():
    return f'Our database have no data of {user_name}'
  elif len(data['user_name']==user_name) < 20:
    return f"We don't have enough data of {user_name} for training"

  if len(user_input_time) != data.shape[1] - 1:
    return f'Password did not match'
  
  data = data[data['user_name'] == user_name]
  data = data.drop(columns=['user_name'])
  pwd_len = len(user_input_time)//2
  for i in range(0,pwd_len):
    data["hold_time_key"+str(i)] = np.array(data["release-"+str(i)]) - np.array(data["press-"+str(i)])

  for i in range(0,pwd_len-1):
    data["key"+str(i)+"_2_key"+str(i+1)] = np.array(data["press-"+str(i+1)]) - np.array(data["release-"+str(i)])

  parameter_lst = []
  for i in range(pwd_len):
    name = "hold_time_key"+str(i)
    hold_time_data = data[name]
    mean = np.mean(hold_time_data)
    std_dev = np.std(hold_time_data)
    cv_percent = (std_dev/mean)*100
    t = {'name': name, 'mean': mean, 'std_dev': std_dev, 'cv_percent': cv_percent} # mean, standard deviation, coff of variation
    parameter_lst.append(t)


  for i in range(pwd_len-1):
    name = "key"+str(i)+"_2_key"+str(i+1)
    release2press_data = data[name]
    mean = np.mean(release2press_data)
    std_dev = np.std(release2press_data)
    cv_percent = (std_dev/mean)*100
    t = {'name': name, 'mean': mean, 'std_dev': std_dev, 'cv_percent': cv_percent}
    parameter_lst.append(t)


  hold_times = []
  release_to_press = []
  for i in range(0,pwd_len*2-1,2):
    hold_time = user_input_time[i+1] - user_input_time[i]
    hold_times.append(hold_time)

  for i in range(1,pwd_len*2-1,2):
    r_to_p = user_input_time[i+1] - user_input_time[i]
    release_to_press.append(r_to_p)

  test_stats = hold_times + release_to_press
  accept_reject = []
  p_values = []
  t_stats = []
  for i, f in enumerate(list(data.keys())[pwd_len*2:]):
    sample1 = data[f]
    sample2 = [test_stats[i]] * len(sample1)
    t_stat, p_value = ttest_rel(sample1, sample2)
    p_values.append(p_value)
    t_stats.append(t_stat)

    if (1 - p_value) < tolerance:
      accept_reject.append("Accept")
    else:
      accept_reject.append("Reject")

  for i in range(len(parameter_lst)):
    parameter_lst[i]['current_val'] = test_stats[i]
    parameter_lst[i]['P Value'] = p_values[i]
    parameter_lst[i]['t-stat'] = t_stats[i]
    parameter_lst[i]['Response'] = accept_reject[i]

    
  threat_score = 0
  for res in accept_reject:
    if res == 'Reject':
      threat_score = threat_score + 1

  threat_score = threat_score/len(parameter_lst)
  parameter_lst.append({'threat_score': threat_score})
  
  if threat_score < 0.7:
    update_file(data_path, user_name, user_input_time)
  return parameter_lst

# if __name__ == "__main__":
#   authenticate_user(data_path, user_name, user_input_time, tolerance)


# with open("keystroke_data.json", "w") as outfile:
#     json.dump(parameter_lst, outfile)


def auth(keystroke_data_path, user_name, user_input_time, tolerance, session_data_path, current_session_data):
	key_analytics = authenticate_user(keystroke_data_path, user_name, user_input_time, tolerance)
	session_analytics = authenticate_user_session(session_data_path, user_name, current_session_data)
	return [{"Session Analytics" : session_analytics,
	"Keystroke Analytics": key_analytics}]

d = auth(keystroke_data_path, user_name, user_input_time, tolerance, session_data_path, current_session_data)
print(json.dumps(d))