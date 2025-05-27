import pandas as pd

# 1. 기존 매핑
url_map = {
    "주문진리조트":       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWlOEH2zomiGPWdrFyMlbnLWSyCh6vY0y88g&s",
    "경포수 호텔":         "https://mblogthumb-phinf.pstatic.net/MjAyNDA4MjVfMTgg/MDAxNzI0NTc1NjAyMzA1.-baoxkCCv1ywB_QnKHsBSydsMkEfq23UHMs0pZ992TIg.K2WGjQJFAtx440-XTN_n-4ytEIJp7Kvvpe4tS3C02FIg.PNG/%EA%B0%95%EB%A6%89%EA%B2%BD%ED%8F%AC%EC%88%98%ED%98%B8%ED%85%94-1.png?type=w800",
    "루이스호텔":           "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRocbxKOV9MaYgUnDbCSwRXPUpSr06ZPTapNQ&s",
    "스카이 베이 경포":     "https://mblogthumb-phinf.pstatic.net/MjAyNDA4MDhfMjAx/MDAxNzIzMTAwMDM1MDI2.Dovpt_bHO_5Vm7ibuzIeadfrSk_7vKN6hnUdmXl1JPsg.VTcORaTQ42E_05dwHOo6k8ieywWruOqJQlYk_0xo8_Ig.JPEG/SE-33f0f3f2-2df3-46e3-9d4e-6e48d377691a.jpg?type=w800",
    "강릉 그레이 호텔":    "https://cf.bstatic.com/xdata/images/hotel/max1024x768/421300564.jpg?k=e1602a47a5840c9720cca824afa6314b533ae8cc75d1a54c4e198ebbadd2bd43&o=&hp=1",
}

# 2. 엑셀 혹은 CSV 파일 읽어오기
#    엑셀일 때:
df = pd.read_excel('이미지 URL_통합본_ver3.xlsx')
#    CSV일 때:
# df = pd.read_csv('이미지URL.csv', encoding='utf-8')

# 3. 빈 URL 제외하고 기존 url_map에 추가
for _, row in df.iterrows():
    name = row['숙소명']
    url = row['이미지 URL']
    if pd.notna(url):
        url_map[name] = url

# 4. 복붙용 딕셔너리 리터럴로 출력
print("url_map = {")
for k, v in url_map.items():
    print(f'    "{k}": "{v}",')
print("}")
