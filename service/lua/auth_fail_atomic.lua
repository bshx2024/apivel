-- service/lua/auth_fail_atomic.lua
-- KEYS[1]: fail_key (e.g. rateLimit:auth:fail:{auth:username})
-- KEYS[2]: lock_key (e.g. rateLimit:auth:softlock:{auth:username})
-- ARGV[1]: threshold (e.g. 10)
-- ARGV[2]: fail_ttl (e.g. 900)
-- ARGV[3]: lock_ttl (e.g. 900)

local fail_key = KEYS[1]
local lock_key = KEYS[2]
local threshold = tonumber(ARGV[1])
local fail_ttl = tonumber(ARGV[2])
local lock_ttl = tonumber(ARGV[3])

local current = redis.call('INCR', fail_key)
-- 每次失败均续期，实现真正的滑动窗口
redis.call('EXPIRE', fail_key, fail_ttl)

if current >= threshold then
    -- 达到阈值原子设置软锁定标记
    redis.call('SET', lock_key, tostring(current), 'EX', lock_ttl)
    return {current, 1} -- [当前累计失败数, 已软锁定=1]
end

return {current, 0} -- [当前累计失败数, 未软锁定=0]
