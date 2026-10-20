#!/bin/bash

# 配置信息
REMOTE_HOST="192.3.41.219"
REMOTE_USER="root"
REMOTE_DIR="/root/new-api"

echo "🚀 [1/4] 检查 SSH 连接..."
ssh -o ConnectTimeout=5 "$REMOTE_USER@$REMOTE_HOST" "exit" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ 无法连接到 VPS，请确保你已经手动能 ssh 登录成功一次。"
    exit 1
fi

# 1. 本地打包代码 (增加 -v 显示文件列表)
echo "📦 [2/4] 正在打包本地代码 (显示部分文件)..."
tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.next' \
    --exclude='web/default/node_modules' --exclude='web/classic/node_modules' \
    -cvzf deploy_package.tar.gz . | head -n 20
echo "...(正在压缩其余文件，请稍候)..."

# 2. 上传到 VPS (使用 rsync 以显示实时进度，如果失败退回到 scp)
echo "📤 [3/4] 正在上传代码包到服务器 (显示实时进度)..."
if command -v rsync &> /dev/null; then
    rsync -ahP deploy_package.tar.gz "$REMOTE_USER@$REMOTE_HOST:/root/"
else
    scp deploy_package.tar.gz "$REMOTE_USER@$REMOTE_HOST:/root/"
fi

# 3. 远程执行部署指令
echo "🛠️ [4/4] 正在服务器上进行远程部署 (这需要几分钟)..."
ssh "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
    # 更新系统源
    apt-get update -y

    # 检查并配置 Swap，防止 1.9G 内存编译前端时 OOM
    if [ $(free -m | awk '/Swap:/ {print $2}') -lt 1024 ]; then
        echo "💾 配置 2G Swap 分区保障容器编译顺畅..."
        fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
    fi

    # 检查并安装 Docker
    if ! command -v docker &> /dev/null; then
        echo "🐳 正在安装 Docker..."
        curl -fsSL https://get.docker.com | bash -s docker
    fi

    # 检查并安装 Docker Compose
    if ! docker compose version &> /dev/null; then
        echo "🔧 正在安装 Docker Compose..."
        apt-get install -y docker-compose-v2
    fi

    # 准备目录
    mkdir -p /root/new-api
    echo "📂 正在服务器上解压文件..."
    tar -xzf /root/deploy_package.tar.gz -C /root/new-api
    rm /root/deploy_package.tar.gz

    # 进入目录并启动
    cd /root/new-api
    echo "🧹 正在清理旧容器和缓存..."
    docker compose down
    
    echo "🏗️ 正在强制重新构建 (No Cache)... 这可能需要 3-5 分钟..."
    docker compose build --no-cache
    docker compose up -d

    echo "✨ 服务器端容器已重新启动！"
EOF

# 清理本地压缩包
rm deploy_package.tar.gz

echo "🎉 部署全部完成！"
echo "🌐 请访问: http://$REMOTE_HOST:3000"
