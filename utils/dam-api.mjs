import got from "got";

export class Dam {
    constructor({ deviceName, osVer, deviceId, appVer }) {
        this.deviceName = deviceName;
        this.osVer = osVer;
        this.deviceId = deviceId;
        this.appVer = appVer;
    }

    baseUri = "https://denmokuapp.clubdam.com";
    headers = {
        "dmk-access-key": "3ZpXW3K8anQvonUX7IMj",
        "Content-Type": "application/json; charset=UTF-8"
    };

    async searchVariousByKeyword(keyword, {
        page
    }) {
        const response = await got.post(`${this.baseUri}/dkwebsys/search-api/SearchVariousByKeywordApi`, {
            headers: this.headers,
            body: JSON.stringify({
                "modelTypeCode": "3",
                "serialNo": "AT00001",
                "pageNo": page,
                "keyword": keyword,
                "sort": "2",
                "modelPatternCode": "0",
                "ondemandSearchPatternCode": "0",
                "compId": "1",
                "authKey": "2/Qb9R@8s*",
                "dispCount": 100
            })
        });

        if (response.ok) 
            return response.body;
         else 
            throw Error("Could not search songs");
        
    }

    async autoComplete(keyword) {
        const response = await got.post(`${this.baseUri}/dkwebsys/search-api/AutoCompleteApi`, {
            headers: this.headers,
            body: JSON.stringify({
                "keyword": keyword,
                "modelTypeCode": "3",
                "serialNo": "AT00001",
                "responseInfoType": "0",
                "compId": "1",
                "authKey": "2/Qb9R@8s*",
                "dispCount": 100,
                "pageNo": 1
            })
        });

        if (response.ok) 
            return response.body;
         else 
            throw Error("Could not autocomplete");
        
    }

    async getMusicDetailInfo(requestNo) {
        const response = await got.post(`${this.baseUri}/dkwebsys/search-api/GetMusicDetailInfoApi`, {
            headers: this.headers,
            body: JSON.stringify({
                "requestNo": requestNo,
                "modelTypeCode": "3",
                "serialNo": "AT00001",
                "responseInfoType": "0",
                "compId": "1",
                "authKey": "2/Qb9R@8s*",
                "dispCount": 100,
                "pageNo": 1
            })
        });

        if (response.ok) 
            return response.body;
         else 
            throw Error("Could not get music detail info");
        
    }
}