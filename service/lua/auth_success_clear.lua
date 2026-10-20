-- service/lua/auth_success_clear.lua
-- KEYS[1]: fail_key (e.g. rateLimit:auth:fail:{auth:username})
-- KEYS[2]: lock_key (e.g. rateLimit:auth:softlock:{auth:username})

redis.call('DEL', KEYS[1])
redis.call('DEL', KEYS[2])
return 1
