package com.exam.system.tier.exception;

import com.exam.system.tier.entity.QuotaDimension;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 配額超出例外 — Controller advice 會轉成 HTTP 429
 */
@Getter
@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class QuotaExceededException extends RuntimeException {

    private final QuotaDimension dimension;
    private final int limit;
    private final int used;

    public QuotaExceededException(QuotaDimension dimension, int limit, int used) {
        super("Quota exceeded for dimension " + dimension + " (limit=" + limit + ", used=" + used + ")");
        this.dimension = dimension;
        this.limit = limit;
        this.used = used;
    }
}
