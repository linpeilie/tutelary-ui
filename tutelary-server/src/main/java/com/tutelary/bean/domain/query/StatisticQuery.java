package com.tutelary.bean.domain.query;

import com.tutelary.common.annotation.Query;
import com.tutelary.common.annotation.Sort;
import com.tutelary.common.bean.domain.BaseQueryDomain;
import com.tutelary.common.enums.QueryType;
import com.tutelary.common.enums.SortDirection;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class StatisticQuery extends BaseQueryDomain {

    @Query
    private String instanceId;

    @Query(queryType = QueryType.GE, field = "report_time")
    private LocalDateTime reportStartTime;

    @Query(queryType = QueryType.LE, field = "report_time")
    private LocalDateTime reportEndTime;

    @Sort(direction = SortDirection.ASC)
    private LocalDateTime reportTime;

}
