import requests
from ddingproject import settings


def get_token():
    access_data = {
        'imp_key':settings.IAMPORT_KEY,
        'imp_secret':settings.IAMPORT_SECRET
    }

    url = "https://api.iamport.kr/users/getToken"
    req = requests.post(url, data=access_data)
    access_res = req.json() 

    if access_res['code'] == 0: 
        return access_res['response'] ['access_token']
    else: 
        return None 

# iamport에 사전 정보를 보내서 결제 준비
def payments_prepare(order_id, amount, *args, **kwargs):
    access_token = get_token()
    if access_token:
        access_data = {
            'merchant_uid':order_id,
            'amount':amount
        }

        url = "https://api.iamport.kr/payments/prepare"
        headers = {
            'Authorization':access_token
        }
        req = requests.post(url, data=access_data, headers=headers)
        res = req.json()

        if res['code'] != 0:
            raise ValueError("API 통신 오류")
    else:
        raise ValueError("토큰 오류")

# 결제 이후에 해당 하는 주문 번호와 결제 금액으로 진행된 결제가 있는지 찾아주는 함수 #결제후검증을위함
def find_transaction(order_id, *args, **kwargs):
    access_token = get_token()
    if access_token:
        url = "https://api.iamport.kr/payments/find/"+order_id
        headers = {
            'Authorization':access_token
            }
        req = requests.post(url, headers=headers)
        res = req.json()
        if res['code'] == 0:
            
            context = {
                'imp_id': res['response']['imp_uid'],
                'merchant_order_id': res['response']['merchant_uid'],
                'amount': res['response']['amount'],
                'status':res['response']['status'],
                'type': res['response']['pay_method'],
                'receipt_url': res['response']['receipt_url']
            }
            return context
        else:
            return None
    else:
        raise ValueError("토큰 오류")
