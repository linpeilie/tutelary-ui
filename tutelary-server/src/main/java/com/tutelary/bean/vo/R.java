package com.tutelary.bean.vo;

import lombok.Data;

import java.io.Serializable;

@Data
public class R<T> implements Serializable {

    private static final Integer SUCCESS = 1;
    private static final Integer FAILED = 0;

    private Integer code;

    private String message;

    private T data;

    public static R success(Object data) {
        R r = new R();
        r.setCode(SUCCESS);
        r.setData(data);
        return r;
    }

}
