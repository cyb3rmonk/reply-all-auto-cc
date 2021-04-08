// SPDX-License-Identifier: GPL-3.0-only
(function(tb){
'use strict';
const verbose = 0;

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
    }));
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
        /*no await*/ tb.compose.setComposeDetails(tab.id, {cc: ['x']});
        await tb.compose.setComposeDetails(tab.id, {cc: []});
    }
    // HACK: editing CC causes focus to move to CC field, which is not useful.
    // Least bad solution is to fix focus manually to body/to.
    for (let delay of [0, 1, 10, 10])
    {
        if (delay) await sleep(delay);
        await set_compose_focus(tab.id, is_reply(msg)&&'body' || 'to', {msg});
    }
};

const set_compose_focus = async (tab_id, target, opt)=>{
    log.info('setting compose focus to', target);
    if (target=='to'||target=='cc'||target=='bcc') {
        let msg = opt&&opt.msg;
        if (!msg)
            msg = await tb.compose.getComposeDetails(tab_id);
        let orig_v = msg[target];
        await tb.compose.setComposeDetails(tab_id, {[target]: [...orig_v, 'x']});
        await tb.compose.setComposeDetails(tab_id, {[target]: orig_v});
    } else if (target=='body') {
        await tb.tabs.executeScript(tab_id, {code: 'window.focus()'});
    } else {
        throw new Error('Invalid focus target: '+target);
    }
};

// type field was added in thunderbird 88
// before, we check for "Re: " prefix in subject to detect
const is_reply = msg=>{
    if (msg.type)
        return msg.type=='reply';
    return (msg.subject||'').startsWith('Re: ');
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
    if (conf.verbose && verbose<conf.verbose)
        return;
    console[conf.cfn||'log'](...args);
};
log.error = log.bind(log, {cfn: 'error'});
log.warn = log.bind(log, {cfn: 'warn'});
log.info = log.bind(log, {cfn: 'log', verbose: 1});
log.debug = log.bind(log, {cfn: 'debug', verbose: 2});
log.trace = log.bind(log, {cfn: 'debug', verbose: 3});

})(messenger);