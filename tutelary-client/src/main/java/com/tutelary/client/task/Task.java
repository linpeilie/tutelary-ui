package com.tutelary.client.task;

import com.tutelary.client.command.Command;
import com.tutelary.common.CommandResult;

import java.util.concurrent.CompletableFuture;

public interface Task {

    String getId();

    void execute();

}
