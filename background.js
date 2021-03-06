// SPDX-License-Identifier: GPL-3.0-only
(function(tb){
'use strict';
const verbose = false;

// TODOS:
// - skip cc conversion when replying to email from 'Sent' directory
//   (no available tb api allows this, as of v88)

const on_compose_start = async (tab, win)=>{
    let msg = await tb.compose.getComposeDetails(tab.id);
    log.info('on_compose_start', json2({
        tab: {id: tab.id, win_id: tab.windowId, url: tab.url,
            status: tab.status},
        win: {id: win.id, type: win.type},
        details: msg,
    }, null, 2));
    focus_compose_body(tab.id);
    // recipients are not available right away, so need to wait
    if (is_reply(msg))
    {
        let waits = [1, 10, 25, 50, 100, 100, 100, 100]; // total: 486
        for (let i=0; !msg.to.length&&!msg.cc.length && i<waits.length; i++)
        {
            await sleep(waits[i]);
            msg = await tb.compose.getComposeDetails(tab.id);
        }
        log.info('final details', json2(msg));
    }
    // REPLY ALL AS CC BEHAVIOR
    if (is_reply(msg) && msg.to.length>1)
    {
        await tb.compose.setComposeDetails(tab.id, {
            to: [msg.to[0]],
            cc: [...msg.to.slice(1), ...msg.cc],
        });
        msg = await tb.compose.getComposeDetails(tab.id);
    }
    // ALWAYS SHOW CC BEHAVIOR
    if (!msg.cc.length)
    {
        tb.compose.setComposeDetails(tab.id, {cc: ['x']});
        await tb.compose.setComposeDetails(tab.id, {cc: []});
    }
    // hack because editing CC causes focus to move to CC field,
    // which is rarely what we want. Least bad solution is to focus body.
    await focus_compose_body(tab.id);
};

const focus_compose_body = tab_id=>
    tb.tabs.executeScript(tab_id, {code: 'window.focus()'});

// type field was added in thunderbird 88
// before, we use non-blank subject + "Re: " subject to detect
const is_reply = msg=>{
    if (msg.type)
        return msg.type=='reply';
    return !!msg.subject && msg.subject.startsWith('Re: ');
};

tb.tabs.onCreated.addListener(tab=>{
    log.trace('tabs.onCreated', tab);
    let win = tb.windows.get(tab.windowId);
    if (win && win.type=='messageCompose')
        on_compose_start(tab, win);
});

tb.tabs.onUpdated.addListener((tab_id, changes, tab)=>{
    log.trace('tabs.onUpdated', {tab_id, changes, tab});
});

tb.windows.onCreated.addListener(async win=>{
    if (win.type!='messageCompose')
        return;
    let win_tabs = await tb.tabs.query({windowId: win.id});
    log.trace('win_tabs', win_tabs);
    if (win_tabs.length)
    {
        if (win_tabs.length>1)
            log.warn('compose window has multiple tabs:', tabs);
        on_compose_start(win_tabs[win_tabs.length-1], win);
    }
});

// -- utils --

const sleep = ms=>new Promise(resolve=>setTimeout(()=>resolve(), ms));

const json2 = v=>JSON.stringify(v, null, 2);
const json0 = v=>JSON.stringify(v);

const log = (conf, ...args)=>{
    if (typeof conf=='string')
        conf = {cfn: conf};
    if (conf.verbose && !verbose)
        return;
    console[conf.cfn||'log'](...args);
};
log.error = log.bind(log, {cfn: 'error'});
log.warn = log.bind(log, {cfn: 'warn'});
log.info = log.bind(log, {cfn: 'log'});
log.debug = log.bind(log, {cfn: 'debug'});
log.trace = log.bind(log, {cfn: 'debug', verbose: 1});

})(messenger);