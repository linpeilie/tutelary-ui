package com.tutelary.client.task.factory;

import com.tutelary.client.task.Task;
import com.tutelary.constants.CommandEnum;
import com.tutelary.session.Session;
import io.netty.channel.ChannelHandlerContext;

import java.lang.instrument.Instrumentation;

public interface TaskFactory {

    CommandEnum commandType();

}
