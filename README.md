# reply-all-auto-cc #

When doing reply-all on a message with multiple "To" recipients, the default
Thunderbird behavior is to preserve "To" recipients as "To" in the reply.
This extension puts them as "Cc" instead (only original sender is kept as "To").

This extension also forces "Cc" field to be always visible on new messages.

# Future improvements #

- Modifying Cc field through the WebExtension API makes Thunderbird move the
  focus to the Cc field. Since this is not a useful default focus for most new
  messages, the add-on manually moves the focus to the message body. However,
  the best behavior would be to leave focus untouched, so as soon as the cc
  focus problem is fixed, the "move focus to body" behavior should be removed.
- There is currently no way to know which message is being replied from the
  WebExtension API. When there is, we should skip the To=>Cc conversion when
  replying to messages from "Sent" folder.