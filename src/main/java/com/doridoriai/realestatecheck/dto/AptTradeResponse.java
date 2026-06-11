package com.doridoriai.realestatecheck.dto;

import java.util.List;

public class AptTradeResponse {

    private String resultCode;
    private String resultMsg;
    private int totalCount;
    private int pageNo;
    private int numOfRows;
    private List<AptTradeItem> items;

    public String getResultCode() { return resultCode; }
    public void setResultCode(String resultCode) { this.resultCode = resultCode; }

    public String getResultMsg() { return resultMsg; }
    public void setResultMsg(String resultMsg) { this.resultMsg = resultMsg; }

    public int getTotalCount() { return totalCount; }
    public void setTotalCount(int totalCount) { this.totalCount = totalCount; }

    public int getPageNo() { return pageNo; }
    public void setPageNo(int pageNo) { this.pageNo = pageNo; }

    public int getNumOfRows() { return numOfRows; }
    public void setNumOfRows(int numOfRows) { this.numOfRows = numOfRows; }

    public List<AptTradeItem> getItems() { return items; }
    public void setItems(List<AptTradeItem> items) { this.items = items; }
}
