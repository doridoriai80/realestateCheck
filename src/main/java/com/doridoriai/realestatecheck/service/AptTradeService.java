package com.doridoriai.realestatecheck.service;

import com.doridoriai.realestatecheck.dto.AptTradeItem;
import com.doridoriai.realestatecheck.dto.AptTradeResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class AptTradeService {

    private final String baseUrl;
    private final String serviceKey;
    private final HttpClient httpClient;

    public AptTradeService(
            @Value("${public-data.api.base-url}") String baseUrl,
            @Value("${public-data.api.service-key}") String serviceKey
    ) {
        this.baseUrl = baseUrl;
        this.serviceKey = serviceKey;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public AptTradeResponse fetch(String lawdCd, String dealYmd, int pageNo, int numOfRows) throws Exception {
        String url = baseUrl
                + "?serviceKey=" + URLEncoder.encode(serviceKey, StandardCharsets.UTF_8)
                + "&LAWD_CD=" + URLEncoder.encode(lawdCd, StandardCharsets.UTF_8)
                + "&DEAL_YMD=" + URLEncoder.encode(dealYmd, StandardCharsets.UTF_8)
                + "&pageNo=" + pageNo
                + "&numOfRows=" + numOfRows;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .GET()
                .build();

        HttpResponse<byte[]> httpResponse = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
        byte[] body = httpResponse.body();

        return parseXml(body);
    }

    private AptTradeResponse parseXml(byte[] xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new ByteArrayInputStream(xml));

        AptTradeResponse response = new AptTradeResponse();
        response.setResultCode(getText(doc, "resultCode"));
        response.setResultMsg(getText(doc, "resultMsg"));
        response.setTotalCount(parseInt(getText(doc, "totalCount")));
        response.setPageNo(parseInt(getText(doc, "pageNo")));
        response.setNumOfRows(parseInt(getText(doc, "numOfRows")));

        List<AptTradeItem> items = new ArrayList<>();
        NodeList itemNodes = doc.getElementsByTagName("item");
        for (int i = 0; i < itemNodes.getLength(); i++) {
            Node node = itemNodes.item(i);
            if (node.getNodeType() == Node.ELEMENT_NODE) {
                items.add(toItem((Element) node));
            }
        }
        response.setItems(items);
        return response;
    }

    private AptTradeItem toItem(Element el) {
        AptTradeItem item = new AptTradeItem();
        item.setSggCd(getChildText(el, "sggCd"));
        item.setUmdNm(getChildText(el, "umdNm"));
        item.setAptNm(getChildText(el, "aptNm"));
        item.setJibun(getChildText(el, "jibun"));
        item.setExcluUseAr(getChildText(el, "excluUseAr"));
        item.setDealYear(getChildText(el, "dealYear"));
        item.setDealMonth(getChildText(el, "dealMonth"));
        item.setDealDay(getChildText(el, "dealDay"));
        item.setDealAmount(getChildText(el, "dealAmount"));
        item.setFloor(getChildText(el, "floor"));
        item.setBuildYear(getChildText(el, "buildYear"));
        item.setDealingGbn(getChildText(el, "dealingGbn"));
        item.setEstateAgentSggNm(getChildText(el, "estateAgentSggNm"));
        item.setAptDong(getChildText(el, "aptDong"));
        item.setCdealType(getChildText(el, "cdealType"));
        item.setCdealDay(getChildText(el, "cdealDay"));
        return item;
    }

    private String getText(Document doc, String tag) {
        NodeList nodes = doc.getElementsByTagName(tag);
        if (nodes.getLength() == 0) return null;
        String text = nodes.item(0).getTextContent();
        return text == null ? null : text.trim();
    }

    private String getChildText(Element parent, String tag) {
        NodeList nodes = parent.getElementsByTagName(tag);
        if (nodes.getLength() == 0) return null;
        String text = nodes.item(0).getTextContent();
        return text == null ? null : text.trim();
    }

    private int parseInt(String s) {
        if (s == null || s.isBlank()) return 0;
        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
