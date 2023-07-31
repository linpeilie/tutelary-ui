package com.tutelary.client.task.event;

import com.google.common.eventbus.EventBus;
import com.google.common.eventbus.Subscribe;
import com.tutelary.common.function.InnerFunction;
import com.tutelary.common.log.Log;
import com.tutelary.common.log.LogFactory;
import java.util.function.Consumer;

public class TaskStateChangeEvents {

    private static final Log LOG = LogFactory.get(TaskStateChangeEvents.class);

    private static final EventBus eventBus = new EventBus();

    static {
        register(event -> LOG.info("task : {} , current state : {}", event.getTaskId(), event.getCurrentState()));
    }

    public static void publish(TaskStateChangeEvent event) {
        eventBus.post(event);
    }

    public static void register(Consumer<TaskStateChangeEvent> consumer) {
        eventBus.register((TaskStateChangeListener) consumer::accept);
    }

    interface TaskStateChangeListener {
        @Subscribe
        void listen(TaskStateChangeEvent event);
    }

}
