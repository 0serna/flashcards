# Use hierarchical browser navigation in the authenticated app

Browser Back in authenticated screens performs upward navigation to the immediate parent regardless of chronological history, stops absolutely at Home, and preserves unsaved-change confirmation; Browser Forward is neutralized so it cannot reopen descendants. This deliberately trades standard browser-history behavior for a predictable app hierarchy, while `/login` retains normal browser navigation and in-flight mutations temporarily ignore Back.
