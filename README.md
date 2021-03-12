# reply-all-auto-cc #

When doing reply-all on a message with multiple "To" recipients, the default
Thunderbird behavior is to preserve "To" recipients as "To" in the reply.
This extension puts them as "Cc" instead (only original sender is kept as "To").

This extension also forces "Cc" field to be always visible on new messages.

**Future improvements**

- Modifying Cc field through the WebExtension API makes Thunderbird move the
  focus to the Cc field. Since this is not a useful default focus for most
  messages, the add-on manually moves the focus after changing cc (body for
  replies, To: for the rest). However, the best behavior would be to leave
  focus untouched so the manual focus logic will be remove if/when the
  "edit cc moves focus to cc" bug is fixed in thunderbird
- The WebExtension API doesn't expose which message is being replied. If/when
  it is added, we should skip the To=>Cc conversion when replying to messages
  from "Sent" folder.
