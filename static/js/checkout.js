$(function () {
    var IMP = window.IMP;
    IMP.init('imp81338869');


    var makeOrderBtn = document.querySelector(".order-form")
    makeOrderBtn.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Hello")
        // order_id 생성
        const order_id = AjaxCreateOrder(e);
        if (order_id == false) {
            alert("주문 생성에 실패했습니다.\n다시 시도해주세요.");
            return;
        }

        // 상품정보
        const amount = parseFloat(document.querySelector("#product_total_cost").textContent);

        const merchatn_id = AjaxStoreTransaction(e, order_id, amount);
        if (merchatn_id !== '') {
            // 상품정보
            const product_name = `${username}-order-${merchant_id}`

            // 폼으로 입력받은 결제 정보
            const buyer_name = `${document.querySelector("#id_last_name").value} ${document.querySelector("#id_first_name").value}`;
            const buyer_email = document.querySelector("#id_email").value;

            IMP.request_pay({
                merchant_uid: merchatn_id,
                name: product_name,
                buyer_name: buyer_name,
                buyer_email: buyer_email,
                amount: amount,
            }, function (rsp) {
                console.log(rsp);
                if (rsp.success) {
                    let msg = '결제가 완료되었습니다.';
                    msg += '고유ID : ' + rsp.imp_uid;
                    msg += '상점 거래ID : ' + rsp.merchant_uid;
                    msg += '결제 금액 : ' + rsp.paid_amount;
                    msg += '카드 승인번호 : ' + rsp.apply_num;
                    // 결제가 완료되었으면 비교해서 디비에 반영
                    ImpTransaction(e, order_id, rsp.merchant_uid, rsp.imp_uid, rsp.paid_amount);
                } else {
                    var msg = '결제에 실패하였습니다.';
                    msg += '에러내용 : ' + rsp.error_msg;
                }
                console.log(msg);
            });
        }
        return false;
    });
});

// $('#make-order').on('click', function (e) { });

//  폼 데이터를 기준으로 주문 생성
function AjaxCreateOrder(e) {
    e.preventDefault();
    var order_id = '';
    var request = $.ajax({
        method: 'POST',
        url: order_create_url,
        async: false,
        data: $('.order-form').serialize()
    });
    request.done(function (data) {
        if (data.order_id) {
            order_id = data.order_id;
        }
    });
    request.fail(function (jqXHR, textStatus) {
        if (jqXHR.status == 404) {
            alert("페이지가 존재하지 않습니다.");
        } else if (jqXHR.status == 403) {
            alert("로그인 해주세요.");
        } else {
            alert("문제가 발생했습니다. 다시 시도해주세요.");
        }
    });
    return order_id;
}

// // 결제 정보 생성
function AjaxStoreTransaction(e, order_id, amount) {
    console.log("AjaxStoreTransaction");
    e.preventDefault();
    var merchant_id = '';
    var request = $.ajax({
        method: 'POST',
        url: order_checkout_url,
        async: false,
        data: {
            order_id: order_id,
            amount: amount,
            csrfmiddlewaretoken: csrf_token,
        }
    });
    request.done(function (data) {
        if (data.works) {
            merchant_id = data.merchant_id;
        }
    });
    request.fail(function (jqXHR, textStatus) {
        console.log(jqXHR);
        if (jqXHR.status == 404) {
            alert("페이지가 존재하지 않습니다.");
        } else if (jqXHR.status == 403) {
            alert("로그인 해주세요.");
        } else {
            alert("문제가 발생했습니다. 다시 시도해주세요.");
        }
    });
    return merchant_id;
}

// // iamport에 결제 정보가 있는지 확인 후 결제 완료 페이지로 이동, validation 수행, 같은금액으로 제대로 결제됐는지 확인
function ImpTransaction(e, order_id, merchant_id, imp_id, amount) {
    e.preventDefault();
    var request = $.ajax({
        method: "POST",
        url: order_validation_url,
        async: false,
        data: {
            order_id: order_id,
            merchant_id: merchant_id,
            imp_id: imp_id,
            amount: amount,
            csrfmiddlewaretoken: csrf_token
        }
    });
    request.done(function (data) {
        if (data.works) {
            $(location).attr('href', location.origin + order_complete_url + '?order_id=' + order_id)
        }
    });
    request.fail(function (jqXHR, textStatus) {
        if (jqXHR.status == 404) {
            alert("페이지가 존재하지 않습니다.");
        } else if (jqXHR.status == 403) {
            alert("로그인 해주세요.");
        } else {
            console.log(jqXHR);
            alert("문제가 발생했습니다. 다시 시도해주세요.");
        }
    });
}