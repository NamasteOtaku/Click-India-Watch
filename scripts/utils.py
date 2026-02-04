# scripts/utils.py
import hashlib
import json
import re
import requests
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple


MANUAL_CLASSIFICATION = [
  { "match": "22Scope News", "language": "Hindi", "category": "News" },
  { "match": "24/7 Shinchan", "language": "Hindi", "category": "Kids" },
  { "match": "4TV News", "language": "Urdu", "category": "News" },
  { "match": "6 TV Telugu", "language": "Telugu", "category": "News" },
  { "match": "7S Music", "language": "Tamil", "category": "Music" },
  { "match": "99TV", "language": "Telugu", "category": "News" },
  { "match": "9X Jalwa", "language": "Hindi", "category": "Music" },
  { "match": "9X Jhakaas", "language": "Marathi", "category": "Music" },
  { "match": "9X Tashan", "language": "Punjabi", "category": "Music" },
  { "match": "9XM", "language": "Hindi", "category": "Music" },
  { "match": "A SPOR", "language": "Turkish", "category": "Sports" },
  { "match": "A2", "language": "Turkish", "category": "Entertainment" },
  { "match": "Aadinath TV", "language": "Hindi", "category": "Religious" },
  { "match": "Aakaash Aath", "language": "Bengali", "category": "Entertainment" },
  { "match": "Aaseervatham TV", "language": "Tamil", "category": "Religious" },
  { "match": "Aastha", "language": "Hindi", "category": "Religious" },
  { "match": "Aastha Bhajan", "language": "Hindi", "category": "Religious" },
  { "match": "Aastha Gujarati", "language": "Gujarati", "category": "Religious" },
  { "match": "Aastha Kannada", "language": "Kannada", "category": "Religious" },
  { "match": "Aastha Tamil", "language": "Tamil", "category": "Religious" },
  { "match": "Aastha Telugu", "language": "Telugu", "category": "Religious" },
  { "match": "ABN Andhra Jyoti", "language": "Telugu", "category": "News" },
  { "match": "ABN TV India", "language": "Hindi", "category": "News" },
  { "match": "ABP Ananda", "language": "Bengali", "category": "News" },
  { "match": "ABP Asmita", "language": "Gujarati", "category": "News" },
  { "match": "ABP Ganga", "language": "Hindi", "category": "News" },
  { "match": "ABP Majha", "language": "Marathi", "category": "News" },
  { "match": "ABP News", "language": "Hindi", "category": "News" },
  { "match": "Abzy Dhakad", "language": "Hindi", "category": "Movies" },
  { "match": "Abzy Movies", "language": "Hindi", "category": "Movies" },
  { "match": "ACCU WEATHER", "language": "English", "category": "Weather" },
  { "match": "Action Hollywood Movies", "language": "English", "category": "Movies" },
  { "match": "AKD Calcutta News", "language": "Bengali", "category": "News" },
  { "match": "AL EKHBARIA", "language": "Arabic", "category": "News" },
  { "match": "AL ISTIQAMA", "language": "Arabic", "category": "Religious" },
  { "match": "AL SUNNAH TV", "language": "Arabic", "category": "Religious" },
  { "match": "Alankar TV", "language": "Telugu", "category": "Entertainment" },
  { "match": "All Time Movies", "language": "Hindi", "category": "Movies" },
  { "match": "ALMASIRA MUBASHER", "language": "Arabic", "category": "News" },
  { "match": "Amar Bangla", "language": "Bengali", "category": "Entertainment" },
  { "match": "Amazon SAT", "language": "Portuguese", "category": "Education" },
  { "match": "Amrita TV", "language": "Malayalam", "category": "Entertainment" },
  { "match": "Ananda Barta", "language": "Bengali", "category": "News" },
  { "match": "ANB News", "language": "Hindi", "category": "News" },
  { "match": "Angel TV", "language": "Tamil", "category": "Religious" },
  { "match": "Angel TV Africa", "language": "English", "category": "Religious" },
  { "match": "Angel TV Arabia", "language": "Arabic", "category": "Religious" },
  { "match": "Angel TV Chinese", "language": "Chinese", "category": "Religious" },
  { "match": "Angel TV Europe", "language": "English", "category": "Religious" },
  { "match": "Angel TV Hebrew", "language": "Hebrew", "category": "Religious" },
  { "match": "Angel TV Russian", "language": "Russian", "category": "Religious" },
  { "match": "Animax Asia", "language": "English", "category": "Kids" },
  { "match": "Anjan TV", "language": "Hindi", "category": "Entertainment" },
  { "match": "ANN News", "language": "Kashmiri", "category": "News" },
  { "match": "Apna Punjab TV", "language": "Punjabi", "category": "Entertainment" },
  { "match": "Aradana TV", "language": "Telugu", "category": "Religious" },
  { "match": "Argus News", "language": "Odia", "category": "News" },
  { "match": "Arihant TV", "language": "Hindi", "category": "Religious" },
  { "match": "Asianet News", "language": "Malayalam", "category": "News" },
  { "match": "Asianet Suvarna News", "language": "Kannada", "category": "News" },
  { "match": "ASSAM TALKS", "language": "Assamese", "category": "News" },
  { "match": "ATN Bangla", "language": "Bengali", "category": "Entertainment" },
  { "match": "ATN Music", "language": "Bengali", "category": "Music" },
  { "match": "Awaaz India TV", "language": "Hindi", "category": "News" },
  { "match": "Awakening TV", "language": "Hindi", "category": "Religious" },
  { "match": "Ayush TV", "language": "Kannada", "category": "Health" },
  { "match": "Azan TV", "language": "Urdu", "category": "Religious" },
  { "match": "B4U Bhojpuri", "language": "Bhojpuri", "category": "Movies" },
  { "match": "B4U Kadak", "language": "Hindi", "category": "Movies" },
  { "match": "B4U Movies", "language": "Hindi", "category": "Movies" },
  { "match": "B4U Music", "language": "Hindi", "category": "Music" },
  { "match": "Bada Khabar", "language": "Odia", "category": "News" },
  { "match": "BAHRAIN QURAN", "language": "Arabic", "category": "Religious" },
  { "match": "Balle Balle", "language": "Punjabi", "category": "Music" },
  { "match": "Bangla Movies", "language": "Bengali", "category": "Movies" },
  { "match": "Bansal News", "language": "Hindi", "category": "News" },
  { "match": "BBC Cbeebies", "language": "English", "category": "Kids" },
  { "match": "BBC Earth", "language": "English", "category": "Documentary" },
  { "match": "BBC WORLD", "language": "English", "category": "News" },
  { "match": "Bein Sports 1", "language": "English", "category": "Sports" },
  { "match": "Bengali Beats", "language": "Bengali", "category": "Music" },
  { "match": "Bflix Movies", "language": "Hindi", "category": "Movies" },
  { "match": "Bhakthi TV", "language": "Telugu", "category": "Religious" },
  { "match": "Bharat Express", "language": "Hindi", "category": "News" },
  { "match": "Bharat Samachar TV", "language": "Hindi", "category": "News" },
  { "match": "Bharat24", "language": "Hindi", "category": "News" },
  { "match": "Bhojpuri Cinema", "language": "Bhojpuri", "category": "Movies" },
  { "match": "Big Magic", "language": "Hindi", "category": "Entertainment" },
  { "match": "BIG TV", "language": "Telugu", "category": "News" },
  { "match": "BIS HABER", "language": "Turkish", "category": "News" },
  { "match": "BPL 2026", "language": "English", "category": "Sports" },
  { "match": "Breaking News", "language": "Hindi", "category": "News" },
  { "match": "Brio TV", "language": "Telugu", "category": "News" },
  { "match": "BRK News", "language": "Hindi", "category": "News" },
  { "match": "BVG", "language": "Hindi", "category": "Religious" },
  { "match": "Calcutta News", "language": "Bengali", "category": "News" },
  { "match": "Captain", "language": "Tamil", "category": "News" },
  { "match": "CARTOON NETWORK", "language": "Hindi", "category": "Kids" },
  { "match": "CCV", "language": "Malayalam", "category": "Religious" },
  { "match": "CGTN News", "language": "English", "category": "News" },
  { "match": "Channel Divya", "language": "Hindi", "category": "Religious" },
  { "match": "Channel S UK", "language": "Bengali", "category": "Entertainment" },
  { "match": "Channel WIN", "language": "Hindi", "category": "Entertainment" },
  { "match": "Chardikla Gurbaani TV", "language": "Punjabi", "category": "Religious" },
  { "match": "Chardikla Time TV", "language": "Punjabi", "category": "News" },
  { "match": "Chithiram", "language": "Tamil", "category": "Kids" },
  { "match": "CNA News", "language": "English", "category": "News" },
  { "match": "CNBC Awaaz", "language": "Hindi", "category": "News" },
  { "match": "CNBC Bajar", "language": "Gujarati", "category": "News" },
  { "match": "CNBC Indonesia", "language": "Indonesian", "category": "News" },
  { "match": "CNBC TV18", "language": "English", "category": "News" },
  { "match": "Cnews Bharat", "language": "Hindi", "category": "News" },
  { "match": "CNN", "language": "English", "category": "News" },
  { "match": "Colors Bangla HD", "language": "Bengali", "category": "Entertainment" },
  { "match": "CVR English", "language": "English", "category": "News" },
  { "match": "CVR Health", "language": "Telugu", "category": "Health" },
  { "match": "CVR News", "language": "Telugu", "category": "News" },
  { "match": "CVR OM Spiritual", "language": "Telugu", "category": "Religious" },
  { "match": "Dangal 2", "language": "Hindi", "category": "Entertainment" },
  { "match": "Dangal TV", "language": "Hindi", "category": "Entertainment" },
  { "match": "Darshana TV", "language": "Malayalam", "category": "Religious" },
  { "match": "DD Arun Prabha", "language": "Hindi", "category": "Public Broadcaster" },
  { "match": "DD Assam", "language": "Assamese", "category": "Public Broadcaster" },
  { "match": "DD Bangla", "language": "Bengali", "category": "Public Broadcaster" },
  { "match": "DD Bharati", "language": "Hindi", "category": "Public Broadcaster" },
  { "match": "DD Bihar", "language": "Hindi", "category": "Public Broadcaster" },
  { "match": "DD Chandana", "language": "Kannada", "category": "Public Broadcaster" },
  { "match": "DD Chhattisgarh", "language": "Hindi", "category": "Public Broadcaster" },
  { "match": "DD Girnar", "language": "Gujarati", "category": "Public Broadcaster" },
  { "match": "DD Goa", "language": "Konkani", "category": "Public Broadcaster" },
  { "match": "DD Haryana", "language": "Hindi", "category": "Public Broadcaster" },
  { "match": "DD Himachal Pradesh", "language": "Hindi", "category": "Public Broadcaster" },
  { "match": "DD India", "language": "English", "category": "Public Broadcaster" },
  { "match": "DD Jharkhand", "language": "Hindi", "category": "Public Broadcaster" },
  { "match": "DD Kashir", "language": "Kashmiri", "category": "Public Broadcaster" },
  { "match": "DD Kisan", "language": "Hindi", "category": "Public Broadcaster" },
  { "match": "DD Madhya Pradesh", "language": "Hindi", "category": "Public Broadcaster" },
  { "match": "DD Malayalam", "language": "Malayalam", "category": "Public Broadcaster" },
  { "match": "DD Manipur", "language": "Manipuri", "category": "Public Broadcaster" },
  { "match": "DD Meghalaya", "language": "English", "category": "Public Broadcaster" },
  { "match": "DD Mizoram", "language": "Mizo", "category": "Public Broadcaster" },
  { "match": "DD Nagaland", "language": "English", "category": "Public Broadcaster" },
  { "match": "DD News", "language": "Hindi", "category": "Public Broadcaster" },
  { "match": "DD Odia", "language": "Odia", "category": "Public Broadcaster" },
  { "match": "DD Punjabi", "language": "Punjabi", "category": "Public Broadcaster" },
  { "match": "DD Rajasthan", "language": "Hindi", "category": "Public Broadcaster" },
  { "match": "DD Sahyadri", "language": "Marathi", "category": "Public Broadcaster" },
  { "match": "DD Saptagiri", "language": "Telugu", "category": "Public Broadcaster" },
  { "match": "DD Sports", "language": "Hindi", "category": "Sports" },
  { "match": "DD Tamil", "language": "Tamil", "category": "Public Broadcaster" },
  { "match": "DD Tripura", "language": "Bengali", "category": "Public Broadcaster" },
  { "match": "DD Urdu", "language": "Urdu", "category": "Public Broadcaster" },
  { "match": "DD Uttar Pradesh", "language": "Hindi", "category": "Public Broadcaster" },
  { "match": "DD Uttarakhand", "language": "Hindi", "category": "Public Broadcaster" },
  { "match": "DD Yadagiri", "language": "Telugu", "category": "Public Broadcaster" },
  { "match": "Deepto TV", "language": "Bengali", "category": "Entertainment" },
  { "match": "Desi Channel", "language": "Punjabi", "category": "Entertainment" },
  { "match": "Dhamaal", "language": "Hindi", "category": "Entertainment" },
  { "match": "Dhamaka Movies B4U", "language": "Hindi", "category": "Movies" },
  { "match": "Dharsan TV", "language": "Tamil", "category": "Religious" },
  { "match": "Dheeran TV", "language": "Tamil", "category": "News" },
  { "match": "Dhoom Music", "language": "Bengali", "category": "Music" },
  { "match": "DIPPTO", "language": "Bengali", "category": "Entertainment" },
  { "match": "Discover Pakistan TV", "language": "Urdu", "category": "Documentary" },
  { "match": "Discovery HD", "language": "English", "category": "Documentary" },
  { "match": "DMAX", "language": "English", "category": "Lifestyle" },
  { "match": "DORACEL TV", "language": "English", "category": "Entertainment" },
  { "match": "Doraemon", "language": "Hindi", "category": "Kids" },
  { "match": "Duck TV", "language": "No Dialogue", "category": "Kids" },
  { "match": "DW English", "language": "English", "category": "News" },
  { "match": "E24", "language": "Hindi", "category": "Entertainment" },
  { "match": "EET TV", "language": "Hindi", "category": "News" },
  { "match": "Ekhone TV", "language": "Bengali", "category": "News" },
  { "match": "Enter 10 Bangla", "language": "Bengali", "category": "Entertainment" },
  { "match": "Epic TV", "language": "Hindi", "category": "Infotainment" },
  { "match": "ETV Comedy", "language": "Telugu", "category": "Entertainment" },
  { "match": "ETV Josh", "language": "Telugu", "category": "Entertainment" },
  { "match": "ETV Music", "language": "Telugu", "category": "Music" },
  { "match": "ETV News", "language": "Telugu", "category": "News" },
  { "match": "ETV TV", "language": "Telugu", "category": "Entertainment" },
  { "match": "Failarmy International", "language": "English", "category": "Entertainment" },
  { "match": "Fakt Marathi", "language": "Marathi", "category": "Entertainment" },
  { "match": "FalconCast", "language": "English", "category": "Other" },
  { "match": "FASHION ONE", "language": "English", "category": "Lifestyle" },
  { "match": "Fateh TV", "language": "Punjabi", "category": "Religious" },
  { "match": "Filamchi Bhojpuri", "language": "Bhojpuri", "category": "Movies" },
  { "match": "First India News", "language": "Hindi", "category": "News" },
  { "match": "Food Food", "language": "Hindi", "category": "Lifestyle" },
  { "match": "Food Network", "language": "English", "category": "Lifestyle" },
  { "match": "FOX NEWS", "language": "English", "category": "News" },
  { "match": "France 24", "language": "English", "category": "News" },
  { "match": "Gazi TV", "language": "Bengali", "category": "Sports" },
  { "match": "Global News", "language": "English", "category": "News" },
  { "match": "Global Punjab", "language": "Punjabi", "category": "Entertainment" },
  { "match": "Go USA", "language": "English", "category": "Travel" },
  { "match": "Goa365", "language": "Konkani", "category": "News" },
  { "match": "God TV", "language": "English", "category": "Religious" },
  { "match": "Goldmines", "language": "Hindi", "category": "Movies" },
  { "match": "Goldmines Movies", "language": "Hindi", "category": "Movies" },
  { "match": "Good News Today", "language": "Hindi", "category": "News" },
  { "match": "GoodNews TV", "language": "Punjabi", "category": "Religious" },
  { "match": "Gopal Bhar", "language": "Bengali", "category": "Kids" },
  { "match": "Green TV", "language": "Hindi", "category": "Entertainment" },
  { "match": "Gubbare", "language": "Hindi", "category": "Kids" },
  { "match": "Gulistan News", "language": "Urdu", "category": "News" },
  { "match": "Gyandarshan", "language": "Hindi", "category": "Education" },
  { "match": "Hamdard TV", "language": "Urdu", "category": "Health" },
  { "match": "Harvest TV", "language": "Malayalam", "category": "Religious" },
  { "match": "Hebron TV", "language": "Tamil", "category": "Religious" },
  { "match": "Hi Dost!", "language": "Hindi", "category": "Kids" },
  { "match": "High News", "language": "Bengali", "category": "News" },
  { "match": "Hinde Movies", "language": "Hindi", "category": "Movies" },
  { "match": "Hindi Khabar", "language": "Hindi", "category": "News" },
  { "match": "Hindu Dharmam", "language": "Telugu", "category": "Religious" },
  { "match": "History TV18 HD", "language": "English", "category": "Documentary" },
  { "match": "HMTV", "language": "Telugu", "category": "News" },
  { "match": "HNN 24x7", "language": "Hindi", "category": "News" },
  { "match": "Hornbill TV", "language": "English", "category": "News" },
  { "match": "Hyder TV", "language": "Telugu", "category": "Religious" },
  { "match": "IBC 24", "language": "Hindi", "category": "News" },
  { "match": "India Today", "language": "English", "category": "News" },
  { "match": "India TV", "language": "Hindi", "category": "News" },
  { "match": "Indywood TV", "language": "English", "category": "Entertainment" },
  { "match": "INews", "language": "Telugu", "category": "News" },
  { "match": "INH 24x7", "language": "Hindi", "category": "News" },
  { "match": "INSIGHT", "language": "English", "category": "Adventure" },
  { "match": "Iran International", "language": "Persian", "category": "News" },
  { "match": "Isai Aruvi", "language": "Tamil", "category": "Music" },
  { "match": "Ishara TV", "language": "Hindi", "category": "Entertainment" },
  { "match": "Ishwar Bhakti TV", "language": "Hindi", "category": "Religious" },
  { "match": "Islam bangla", "language": "Bengali", "category": "Religious" },
  { "match": "Jago News 24", "language": "Bengali", "category": "News" },
  { "match": "Jai Maharashtra", "language": "Marathi", "category": "News" },
  { "match": "Jaihind TV", "language": "Malayalam", "category": "News" },
  { "match": "Jan TV", "language": "Hindi", "category": "News" },
  { "match": "Janta TV", "language": "Hindi", "category": "News" },
  { "match": "Jeevan TV", "language": "Malayalam", "category": "Entertainment" },
  { "match": "Jinvani Channel", "language": "Hindi", "category": "Religious" },
  { "match": "JK 24x7 News", "language": "Hindi", "category": "News" },
  { "match": "Joo Music", "language": "Hindi", "category": "Music" },
  { "match": "Kairali News", "language": "Malayalam", "category": "News" },
  { "match": "Kairali TV", "language": "Malayalam", "category": "Entertainment" },
  { "match": "Kalaignar Murasu", "language": "Tamil", "category": "Movies" },
  { "match": "Kalaignar Seithigal", "language": "Tamil", "category": "News" },
  { "match": "Kalaignar TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "Kalinga TV", "language": "Odia", "category": "News" },
  { "match": "Kannur Vision", "language": "Malayalam", "category": "News" },
  { "match": "Kappa TV", "language": "Malayalam", "category": "Music" },
  { "match": "Kashish News", "language": "Hindi", "category": "News" },
  { "match": "Kaumudy TV", "language": "Malayalam", "category": "Entertainment" },
  { "match": "KCL TV", "language": "Punjabi", "category": "Religious" },
  { "match": "KCM", "language": "Tamil", "category": "Music" },
  { "match": "Kerala Vision", "language": "Malayalam", "category": "News" },
  { "match": "Khushboo Bangla", "language": "Bengali", "category": "Entertainment" },
  { "match": "KITE Victers", "language": "Malayalam", "category": "Education" },
  { "match": "Kolkata TV", "language": "Bengali", "category": "News" },
  { "match": "Live Quran TV", "language": "Arabic", "category": "Religious" },
  { "match": "Lokshahi News", "language": "Marathi", "category": "News" },
  { "match": "Lotus", "language": "Tamil", "category": "News" },
  { "match": "Madani TV", "language": "Urdu", "category": "Religious" },
  { "match": "Madhimugam TV", "language": "Tamil", "category": "News" },
  { "match": "Maha Movie", "language": "Hindi", "category": "Movies" },
  { "match": "Maiboli", "language": "Marathi", "category": "Music" },
  { "match": "Makka Live", "language": "Arabic", "category": "Religious" },
  { "match": "Makkal TV", "language": "Tamil", "category": "News" },
  { "match": "Malai Murasu TV", "language": "Tamil", "category": "News" },
  { "match": "Malar TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "Mango Mobile TV", "language": "Telugu", "category": "Entertainment" },
  { "match": "Manoranjan Grand", "language": "Hindi", "category": "Entertainment" },
  { "match": "Manoranjan Movies", "language": "Hindi", "category": "Movies" },
  { "match": "Manoranjan TV", "language": "Hindi", "category": "Entertainment" },
  { "match": "Mastiii", "language": "Hindi", "category": "Music" },
  { "match": "Max Middle East", "language": "Hindi", "category": "Movies" },
  { "match": "Mazhavil Manorama HD", "language": "Malayalam", "category": "Entertainment" },
  { "match": "Me-TV", "language": "Bengali", "category": "Entertainment" },
  { "match": "Media One", "language": "Malayalam", "category": "News" },
  { "match": "Mercy TV", "language": "Telugu", "category": "Religious" },
  { "match": "Metro TV", "language": "Bengali", "category": "News" },
  { "match": "Mh 1 Music", "language": "Punjabi", "category": "Music" },
  { "match": "Mh 1 News", "language": "Punjabi", "category": "News" },
  { "match": "MH One Dil Se", "language": "Hindi", "category": "Music" },
  { "match": "MK Six", "language": "Tamil", "category": "Music" },
  { "match": "MNTV", "language": "Tamil", "category": "News" },
  { "match": "Moon TV", "language": "Tamil", "category": "Movies" },
  { "match": "Motor Vision", "language": "English", "category": "Lifestyle" },
  { "match": "Movies Thriller", "language": "English", "category": "Movies" },
  { "match": "Music Bangla", "language": "Bengali", "category": "Music" },
  { "match": "Music India", "language": "Hindi", "category": "Music" },
  { "match": "Nagaland TV", "language": "English", "category": "News" },
  { "match": "Namdhari", "language": "Punjabi", "category": "Religious" },
  { "match": "Nazara", "language": "Hindi", "category": "Entertainment" },
  { "match": "NDTV 24X7", "language": "English", "category": "News" },
  { "match": "NDTV Good Times", "language": "English", "category": "Lifestyle" },
  { "match": "NDTV India", "language": "Hindi", "category": "News" },
  { "match": "NDTV Madhya Pradesh", "language": "Hindi", "category": "News" },
  { "match": "NDTV Marathi", "language": "Marathi", "category": "News" },
  { "match": "NDTV Profit", "language": "English", "category": "Business" },
  { "match": "NDTV Rajasthan", "language": "Hindi", "category": "News" },
  { "match": "NE NEWS", "language": "English", "category": "News" },
  { "match": "News 1st", "language": "Kannada", "category": "News" },
  { "match": "News 24", "language": "Hindi", "category": "News" },
  { "match": "News 7 Tamil", "language": "Tamil", "category": "News" },
  { "match": "News Daily 24", "language": "Bengali", "category": "News" },
  { "match": "News J", "language": "Tamil", "category": "News" },
  { "match": "News Live", "language": "Assamese", "category": "News" },
  { "match": "News Nation", "language": "Hindi", "category": "News" },
  { "match": "News18 Assam North-East", "language": "Assamese", "category": "News" },
  { "match": "News18 Bangla", "language": "Bengali", "category": "News" },
  { "match": "News18 Bihar Jharkhand", "language": "Hindi", "category": "News" },
  { "match": "News18 Gujarati", "language": "Gujarati", "category": "News" },
  { "match": "News18 India", "language": "Hindi", "category": "News" },
  { "match": "News18 JKLH", "language": "Hindi", "category": "News" },
  { "match": "News18 Kannada", "language": "Kannada", "category": "News" },
  { "match": "News18 Kerala", "language": "Malayalam", "category": "News" },
  { "match": "News18 Lokmat", "language": "Marathi", "category": "News" },
  { "match": "News18 Madhya Pradesh", "language": "Hindi", "category": "News" },
  { "match": "News18 Odia", "language": "Odia", "category": "News" },
  { "match": "News18 Punjab", "language": "Punjabi", "category": "News" },
  { "match": "News18 Rajasthan", "language": "Hindi", "category": "News" },
  { "match": "News18 Tamil Nadu", "language": "Tamil", "category": "News" },
  { "match": "News18 Urdu", "language": "Urdu", "category": "News" },
  { "match": "News18 Uttar Pradesh", "language": "Hindi", "category": "News" },
  { "match": "NewsTime Bangla", "language": "Bengali", "category": "News" },
  { "match": "Nireekshana TV", "language": "Telugu", "category": "Religious" },
  { "match": "Noor Tv", "language": "Urdu", "category": "Religious" },
  { "match": "Northeast Live", "language": "English", "category": "News" },
  { "match": "NTC TV", "language": "Nepali", "category": "News" },
  { "match": "NTV UK", "language": "Bengali", "category": "Entertainment" },
  { "match": "Odisha TV", "language": "Odia", "category": "News" },
  { "match": "OM TV", "language": "Hindi", "category": "Religious" },
  { "match": "Orange Bangla TV", "language": "Bengali", "category": "Entertainment" },
  { "match": "Oscar Movies Bhojpuri", "language": "Bhojpuri", "category": "Movies" },
  { "match": "OUTDOOR CHANNEL", "language": "English", "category": "Sports" },
  { "match": "Padma Tv", "language": "Bengali", "category": "Entertainment" },
  { "match": "Pasand TV", "language": "Hindi", "category": "Entertainment" },
  { "match": "PBS Kids", "language": "English", "category": "Kids" },
  { "match": "Peace TV Bangla", "language": "Bengali", "category": "Religious" },
  { "match": "Peace TV English", "language": "English", "category": "Religious" },
  { "match": "Peace TV Urdu", "language": "Urdu", "category": "Religious" },
  { "match": "PEAR TV", "language": "Hindi", "category": "Entertainment" },
  { "match": "People are Awesome", "language": "English", "category": "Entertainment" },
  { "match": "Peppers TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "Pogo", "language": "Hindi", "category": "Kids" },
  { "match": "Polimer News", "language": "Tamil", "category": "News" },
  { "match": "Polimer TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "Power TV", "language": "Kannada", "category": "News" },
  { "match": "Prarthana TV", "language": "Odia", "category": "Religious" },
  { "match": "Pratham Khabar 24x7", "language": "Odia", "category": "News" },
  { "match": "Pratidin Time", "language": "Assamese", "category": "News" },
  { "match": "Pravasi Channel", "language": "Malayalam", "category": "Lifestyle" },
  { "match": "Press TV Iran", "language": "English", "category": "News" },
  { "match": "Prime9 News", "language": "Telugu", "category": "News" },
  { "match": "PRO Sport International", "language": "English", "category": "Sports" },
  { "match": "Prudent Media", "language": "Konkani", "category": "News" },
  { "match": "PSN Sports", "language": "English", "category": "Sports" },
  { "match": "PTC Chakde", "language": "Punjabi", "category": "Music" },
  { "match": "PTC Music", "language": "Punjabi", "category": "Music" },
  { "match": "PTC News", "language": "Punjabi", "category": "News" },
  { "match": "PTC Punjabi", "language": "Punjabi", "category": "Entertainment" },
  { "match": "Public Movies", "language": "Kannada", "category": "Movies" },
  { "match": "Public Music", "language": "Kannada", "category": "Music" },
  { "match": "Public TV", "language": "Kannada", "category": "News" },
  { "match": "Pulari TV", "language": "Malayalam", "category": "Entertainment" },
  { "match": "Puthiya Thalaimurai", "language": "Tamil", "category": "News" },
  { "match": "Puthuyugam TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "QURAN KAREEM TV", "language": "Arabic", "category": "Religious" },
  { "match": "R Plus", "language": "Bengali", "category": "Entertainment" },
  { "match": "R Plus Gold", "language": "Bengali", "category": "Entertainment" },
  { "match": "R Plus News", "language": "Bengali", "category": "News" },
  { "match": "Raftaar Media", "language": "Hindi", "category": "News" },
  { "match": "Raj Musix Malayalam", "language": "Malayalam", "category": "Music" },
  { "match": "Raj Musix Telugu", "language": "Telugu", "category": "Music" },
  { "match": "Raj TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "RDX Goa", "language": "Konkani", "category": "News" },
  { "match": "Real Madrid tv", "language": "English", "category": "Sports" },
  { "match": "Real News Kerala", "language": "Malayalam", "category": "News" },
  { "match": "REAL WILD", "language": "English", "category": "Documentary" },
  { "match": "Redbull TV", "language": "English", "category": "Sports" },
  { "match": "Reporter TV", "language": "Malayalam", "category": "News" },
  { "match": "Republic Bangla", "language": "Bengali", "category": "News" },
  { "match": "Republic Bharat", "language": "Hindi", "category": "News" },
  { "match": "Republic Kannada", "language": "Kannada", "category": "News" },
  { "match": "Republic TV", "language": "English", "category": "News" },
  { "match": "Roja Movies", "language": "Telugu", "category": "Movies" },
  { "match": "Roja TV", "language": "Telugu", "category": "Entertainment" },
  { "match": "Rongeen TV", "language": "Bengali", "category": "Kids" },
  { "match": "RT India", "language": "English", "category": "News" },
  { "match": "RT NEWS", "language": "English", "category": "News" },
  { "match": "RTA Sports", "language": "Pashto", "category": "Sports" },
  { "match": "RTV Music", "language": "Bengali", "category": "Music" },
  { "match": "Rupasi Bangla", "language": "Bengali", "category": "Entertainment" },
  { "match": "Saam TV", "language": "Marathi", "category": "News" },
  { "match": "Sadhna", "language": "Hindi", "category": "Religious" },
  { "match": "Sadhna Plus News", "language": "Hindi", "category": "News" },
  { "match": "Safari TV", "language": "Malayalam", "category": "Travel" },
  { "match": "Salaam TV", "language": "Urdu", "category": "Religious" },
  { "match": "Salvation TV", "language": "Tamil", "category": "Religious" },
  { "match": "Sana TV", "language": "Urdu", "category": "Religious" },
  { "match": "Sangeet Bangla", "language": "Bengali", "category": "Music" },
  { "match": "Sangeet Bhojpuri", "language": "Bhojpuri", "category": "Music" },
  { "match": "Sangeet Marathi", "language": "Marathi", "category": "Music" },
  { "match": "Sankara TV", "language": "Tamil", "category": "Religious" },
  { "match": "Sansad TV", "language": "Hindi", "category": "News" },
  { "match": "Sanskar TV", "language": "Hindi", "category": "Religious" },
  { "match": "Santvani Channel", "language": "Gujarati", "category": "Religious" },
  { "match": "Sathiyam TV", "language": "Tamil", "category": "News" },
  { "match": "Satsang TV", "language": "Hindi", "category": "Religious" },
  { "match": "Shalini TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "Shalom", "language": "Malayalam", "category": "Religious" },
  { "match": "Sharjah Sports", "language": "Arabic", "category": "Sports" },
  { "match": "Sheemaroo Bollywood", "language": "Hindi", "category": "Movies" },
  { "match": "Shekinah TV", "language": "Malayalam", "category": "Religious" },
  { "match": "Shemaroo Josh", "language": "Hindi", "category": "Entertainment" },
  { "match": "Shemaroo Marathi Bana", "language": "Marathi", "category": "Entertainment" },
  { "match": "Shemaroo TV", "language": "Hindi", "category": "Entertainment" },
  { "match": "Shemaroo Umang", "language": "Hindi", "category": "Entertainment" },
  { "match": "ShowBox", "language": "Hindi", "category": "Music" },
  { "match": "Shubh Cinema TV", "language": "Hindi", "category": "Movies" },
  { "match": "Shubh TV", "language": "Hindi", "category": "Religious" },
  { "match": "Shubhsandesh TV", "language": "Hindi", "category": "Religious" },
  { "match": "Siri Kannada", "language": "Kannada", "category": "Entertainment" },
  { "match": "Sirippoli TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "Sooriyan TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "Srk Tv", "language": "Tamil", "category": "Entertainment" },
  { "match": "START AIR", "language": "Russian", "category": "Sports" },
  { "match": "START WORLD", "language": "English", "category": "Sports" },
  { "match": "Steelbird Music", "language": "Malayalam", "category": "Music" },
  { "match": "Studio One +", "language": "Malayalam", "category": "Entertainment" },
  { "match": "Studio Yuva", "language": "Malayalam", "category": "Entertainment" },
  { "match": "Subhavaartha TV", "language": "Telugu", "category": "Religious" },
  { "match": "Sudarshan News", "language": "Hindi", "category": "News" },
  { "match": "SVBC", "language": "Telugu", "category": "Religious" },
  { "match": "Swadesh News", "language": "Hindi", "category": "News" },
  { "match": "Swaraj Express", "language": "Hindi", "category": "News" },
  { "match": "Swatantra TV", "language": "Telugu", "category": "News" },
  { "match": "T Global News", "language": "Punjabi", "category": "News" },
  { "match": "T News", "language": "Telugu", "category": "News" },
  { "match": "Tabbar Hits", "language": "Punjabi", "category": "Music" },
  { "match": "Tamil Janam", "language": "Tamil", "category": "News" },
  { "match": "Tamilan TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "Tarang Music", "language": "Odia", "category": "Music" },
  { "match": "Tarang TV", "language": "Odia", "category": "Entertainment" },
  { "match": "Tehzeeb TV", "language": "Urdu", "category": "Religious" },
  { "match": "Telugu One", "language": "Telugu", "category": "Entertainment" },
  { "match": "Thalaa TV", "language": "Tamil", "category": "Movies" },
  { "match": "Thanthi One", "language": "Tamil", "category": "Entertainment" },
  { "match": "Thanthi TV", "language": "Tamil", "category": "News" },
  { "match": "The Pet Collective", "language": "English", "category": "Entertainment" },
  { "match": "Thendral TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "Times Now Navbharat", "language": "Hindi", "category": "News" },
  { "match": "TOI Global", "language": "English", "category": "News" },
  { "match": "Tolly TV", "language": "Telugu", "category": "Movies" },
  { "match": "Total Bhakti", "language": "Hindi", "category": "Religious" },
  { "match": "Total TV Haryana", "language": "Hindi", "category": "News" },
  { "match": "Travel XP", "language": "English", "category": "Travel" },
  { "match": "Tribe TV", "language": "Santali", "category": "News" },
  { "match": "TRT 1", "language": "Turkish", "category": "Public Broadcaster" },
  { "match": "TRT WORLD", "language": "English", "category": "News" },
  { "match": "TV BRICS English", "language": "English", "category": "News" },
  { "match": "TV Punjab", "language": "Punjabi", "category": "News" },
  { "match": "TV5 Kannada", "language": "Kannada", "category": "News" },
  { "match": "TV9 Bangla", "language": "Bengali", "category": "News" },
  { "match": "TV9 Bharatvarsh", "language": "Hindi", "category": "News" },
  { "match": "TV9 Gujarati", "language": "Gujarati", "category": "News" },
  { "match": "TV9 Kannada", "language": "Kannada", "category": "News" },
  { "match": "TV9 Marathi", "language": "Marathi", "category": "News" },
  { "match": "TV9 Telugu", "language": "Telugu", "category": "News" },
  { "match": "Twenty Four News", "language": "Malayalam", "category": "News" },
  { "match": "UNIQUE TV", "language": "Hindi", "category": "Entertainment" },
  { "match": "Vaanavil TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "Vanitha TV", "language": "Telugu", "category": "Entertainment" },
  { "match": "Vasanth TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "VBC News", "language": "Telugu", "category": "News" },
  { "match": "VCV", "language": "Tamil", "category": "News" },
  { "match": "Vedic", "language": "Hindi", "category": "Religious" },
  { "match": "Velicham", "language": "Tamil", "category": "Religious" },
  { "match": "Vendhar TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "VIP News", "language": "Hindi", "category": "News" },
  { "match": "Vyas NIC", "language": "Hindi", "category": "Education" },
  { "match": "Wayanad Vision", "language": "Malayalam", "category": "News" },
  { "match": "WAZ TV", "language": "Bengali", "category": "Religious" },
  { "match": "Weatherspy", "language": "English", "category": "Weather" },
  { "match": "Wild Earth", "language": "English", "category": "Documentary" },
  { "match": "Win TV", "language": "Tamil", "category": "Entertainment" },
  { "match": "WION", "language": "English", "category": "News" },
  { "match": "YRF Music", "language": "Hindi", "category": "Music" },
  { "match": "Zainabia Channel", "language": "Urdu", "category": "Religious" },
  { "match": "ZB Bhakti", "language": "Hindi", "category": "Religious" },
  { "match": "ZB Cartoon", "language": "Hindi", "category": "Kids" },
  { "match": "ZB Cinema", "language": "Hindi", "category": "Movies" },
  { "match": "ZB Music", "language": "Hindi", "category": "Music" },
  { "match": "Zee 24 Ghanta", "language": "Bengali", "category": "News" },
  { "match": "Zee 24 Kalak", "language": "Gujarati", "category": "News" },
  { "match": "Zee 24 Taas", "language": "Marathi", "category": "News" },
  { "match": "Zee Bharat", "language": "Hindi", "category": "News" },
  { "match": "Zee Bihar Jharkhand", "language": "Hindi", "category": "News" },
  { "match": "Zee Business", "language": "Hindi", "category": "Business" },
  { "match": "Zee Delhi NCR Haryana", "language": "Hindi", "category": "News" },
  { "match": "Zee Kannada News", "language": "Kannada", "category": "News" },
  { "match": "Zee Madhya Pradesh Chhattisgarh", "language": "Hindi", "category": "News" },
  { "match": "Zee News", "language": "Hindi", "category": "News" },
  { "match": "Zee News Malayalam", "language": "Malayalam", "category": "News" },
  { "match": "Zee Punjab Haryana Himachal", "language": "Punjabi", "category": "News" },
  { "match": "Zee Rajasthan", "language": "Hindi", "category": "News" },
  { "match": "Zee Telugu News", "language": "Telugu", "category": "News" },
  { "match": "Zee Uttar Pradesh/Uttarakhand", "language": "Hindi", "category": "News" },
  { "match": "ZillarBarta News", "language": "Bengali", "category": "News" },
  { "match": "Zoo Moo", "language": "English", "category": "Kids" },
  { "match": "ZOOM", "language": "Hindi", "category": "Entertainment" },
  { "match": "ТНТ", "language": "Russian", "category": "Entertainment" },
  { "match": "Duronto TV", "language": "Bengali", "category": "Kids" },
  { "match": "Sathiya TV Srilanka", "language": "Tamil", "category": "News" }
]


def get_project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def get_manual_classification(name: str) -> Optional[Dict]:
    """
    Get manual classification for a channel by name.
    Tries exact match first, then startsWith, then includes.
    Returns None if no match found.
    """
    if not name:
        return None
    
    name_lower = name.lower()
    
    # Exact match (case-insensitive)
    for entry in MANUAL_CLASSIFICATION:
        if name_lower == entry["match"].lower():
            return entry
    
    # startsWith
    for entry in MANUAL_CLASSIFICATION:
        if name_lower.startswith(entry["match"].lower()):
            return entry
    
    # includes
    for entry in MANUAL_CLASSIFICATION:
        if entry["match"].lower() in name_lower:
            return entry
    
    return None


def load_sources() -> List[str]:
    sources_file = get_project_root() / "data" / "sources.txt"
    sources = []
    if sources_file.exists():
        with open(sources_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    sources.append(line)
    return sources


def fetch_playlist(url: str, max_retries: int = 3, timeout: int = 15) -> Optional[str]:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
            response.raise_for_status()
            
            content_type = response.headers.get('Content-Type', '').lower()
            if not any(x in content_type for x in ['mpegurl', 'm3u', 'text']):
                print(f"Warning: Unexpected Content-Type for {url}: {content_type}")
            
            text = response.text
            if '#EXTM3U' not in text[:2048]:
                print(f"Rejected non-M3U source: {url}")
                return None
            
            return text
        except Exception:
            if attempt < max_retries - 1:
                continue
            return None
    return None


def parse_extinf_line(line: str) -> Tuple[Dict[str, str], Optional[str]]:
    if not line.startswith('#EXTINF:'):
        return {}, None
    
    parts = line.split(',', 1)
    if len(parts) != 2:
        return {}, None
    
    header = parts[0]
    name = parts[1].strip()
    attrs = {}
    
    match = re.search(r'tvg-id="([^"]*)"', header)
    if match:
        attrs['tvg-id'] = match.group(1)
    
    match = re.search(r'tvg-name="([^"]*)"', header)
    if match:
        attrs['tvg-name'] = match.group(1)
    
    match = re.search(r'tvg-logo="([^"]*)"', header)
    if match:
        attrs['tvg-logo'] = match.group(1)
    
    match = re.search(r'group-title="([^"]*)"', header)
    if match:
        attrs['group-title'] = match.group(1)
    
    return attrs, name


def parse_playlist(content: str, source_url: str) -> List[Dict]:
    channels = []
    lines = content.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        if line.startswith('#EXTINF:'):
            attrs, name = parse_extinf_line(line)
            
            i += 1
            while i < len(lines):
                stream_url = lines[i].strip()
                if stream_url and not stream_url.startswith('#'):
                    break
                i += 1
            
            if i >= len(lines) or not stream_url:
                continue
            
            if not (stream_url.startswith('http://') or stream_url.startswith('https://')):
                i += 1
                continue
            
            channel = {
                'name': name or 'Unknown',
                'stream_url': stream_url,
                'logo': attrs.get('tvg-logo', None),
                'group': attrs.get('group-title', None),
                'source_file': source_url,
                'attrs': attrs
            }
            channels.append(channel)
        
        i += 1
    
    return channels


def generate_id(stream_url: str) -> str:
    return hashlib.sha256(stream_url.encode('utf-8')).hexdigest()[:16]


def detect_language(name: str, group: str) -> str:
    """Detect language from channel name and group using keyword rules."""
    text = f"{name} {group}".lower()
    
    hindi_kw = ['zee', 'star', 'dd', 'bharat', 'aaj', 'india', 'news18']
    english_kw = ['tv', 'news', 'times', 'global', 'international']
    tamil_kw = ['sun', 'kalaignar', 'polimer', 'thanthi']
    telugu_kw = ['etv', 'gemini', 'sakshi']
    malayalam_kw = ['asianet', 'manorama', 'kairali']
    bengali_kw = ['bangla', 'zee bangla']
    punjabi_kw = ['ptc', 'chardikla']
    marathi_kw = ['abp maza', 'zee marathi']
    urdu_kw = ['hum', 'ary']
    
    if any(kw in text for kw in hindi_kw):
        return 'Hindi'
    if any(kw in text for kw in english_kw):
        return 'English'
    if any(kw in text for kw in tamil_kw):
        return 'Tamil'
    if any(kw in text for kw in telugu_kw):
        return 'Telugu'
    if any(kw in text for kw in malayalam_kw):
        return 'Malayalam'
    if any(kw in text for kw in bengali_kw):
        return 'Bengali'
    if any(kw in text for kw in punjabi_kw):
        return 'Punjabi'
    if any(kw in text for kw in marathi_kw):
        return 'Marathi'
    if any(kw in text for kw in urdu_kw):
        return 'Urdu'
    
    return 'Unknown'


def normalize_category(name: str, group: str) -> str:
    """Normalize category from group or name."""
    text = f"{name} {group}".lower()
    
    news_kw = ['news', 'samachar', 'tv9', 'ndtv']
    sports_kw = ['sports', 'cricket', 'ten sports']
    kids_kw = ['kids', 'cartoon', 'shinchan', 'pogo']
    movies_kw = ['movies', 'cinema', 'film']
    religious_kw = ['bhajan', 'aastha', 'sanskar', 'islam', 'quran']
    music_kw = ['music', 'mtv', '9xm']
    
    if any(kw in text for kw in news_kw):
        return 'News'
    if any(kw in text for kw in sports_kw):
        return 'Sports'
    if any(kw in text for kw in kids_kw):
        return 'Kids'
    if any(kw in text for kw in movies_kw):
        return 'Movies'
    if any(kw in text for kw in religious_kw):
        return 'Religious'
    if any(kw in text for kw in music_kw):
        return 'Music'
    
    return 'Entertainment'


def normalize_channel(channel: Dict, first_seen: str, last_seen: str) -> Dict:
    name = channel['name']
    group = channel['group'] or ''
    
    # Use manual classification if available, otherwise use Unknown/Other
    manual = get_manual_classification(name)
    if manual:
        language = manual["language"]
        category = manual["category"]
    else:
        language = "Unknown"
        category = "Other"
    
    return {
        'id': generate_id(channel['stream_url']),
        'name': name,
        'language': language,
        'country': 'India',
        'logo': channel['logo'] if channel['logo'] else None,
        'group': group,
        'category': category,
        'source_file': channel['source_file'],
        'stream_url': channel['stream_url'],
        'tags': [],
        'browser_playable': True,
        'first_seen': first_seen,
        'last_seen': last_seen,
        'health_score': 1.0
    }


def deduplicate_channels(channels: List[Dict]) -> List[Dict]:
    seen = set()
    unique = []
    for ch in channels:
        url = ch['stream_url']
        if url not in seen:
            seen.add(url)
            unique.append(ch)
    return unique


def save_channels_json(channels: List[Dict], output_file: str):
    sorted_channels = sorted(channels, key=lambda x: x['name'].lower())
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(sorted_channels, f, indent=2, ensure_ascii=False)


def load_json(path: str) -> Optional[List[Dict]]:
    path_obj = Path(path)
    if not path_obj.exists():
        return None
    with open(path_obj, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(obj: List[Dict], path: str):
    path_obj = Path(path)
    path_obj.parent.mkdir(parents=True, exist_ok=True)
    with open(path_obj, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)


def get_daily_status_file() -> Path:
    from datetime import date
    status_dir = get_project_root() / "data" / "status"
    status_dir.mkdir(parents=True, exist_ok=True)
    return status_dir / f"{date.today().isoformat()}.json"


def classify_stream(http_code: int, resp_time_ms: float, content_type: str, head_success: bool, get_success: bool) -> str:
    if http_code >= 400 or not head_success:
        return "dead"
    
    if head_success and not get_success:
        return "unstable"
    
    if not content_type or not any(x in content_type.lower() for x in ['mpeg', 'video', 'm3u', 'stream', 'octet']):
        if get_success:
            return "unstable"
        return "dead"
    
    if resp_time_ms >= 3000:
        return "slow"
    
    return "live"


def is_browser_playable(stream_url: str, http_code: int, status: str, content_type: str) -> bool:
    """Determine if stream is browser playable based on multiple factors."""
    if stream_url.startswith('http://'):
        return False
    
    if http_code == 403:
        return False
    
    if status == 'dead':
        return False
    
    if not content_type or content_type.strip() == '':
        return False
    
    return True


def update_health_score(channel: Dict, status: str) -> Dict:
    score = channel.get('health_score', 1.0)
    
    if status == 'live':
        score = min(score + 0.01, 1.0)
    elif status == 'slow':
        score = min(score + 0.005, 1.0)
    elif status == 'unstable':
        score = max(score - 0.02, 0.0)
    elif status == 'dead':
        score = max(score - 0.05, 0.0)
    
    channel['health_score'] = score
    
    if status in ['live', 'slow']:
        channel['last_seen'] = datetime.now(timezone.utc).isoformat()
    
    return channel