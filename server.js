const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const bodyParser = require('body-parser');
const app = express();
const jwt = require('jsonwebtoken');
const jsonfile = require('jsonfile');
app.use(bodyParser.json());

const FilePath = 'db.json'

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(cors({
    origin: '*'
  }));

  app.get('/cats', async (req, res) => {
    try {
      // 从 db.json 文件中读取数据
      const Data = await fs.readFile(FilePath, 'utf8');
      const jsonData = JSON.parse(Data);
  
      // 构建分类及其对应的产品数据
      const categoriesWithProducts = jsonData.cats.map(category => {
        const productsInCategory = jsonData.products.filter(product => product.catId === category.id);
        return {
          id: category.id,
          name: category.name,
          products: productsInCategory
        };
      });
  
      // 返回分类及其对应的产品数据
      res.json(categoriesWithProducts);
    } catch (error) {
      console.error('检索数据时出错:', error);
      res.status(500).json({ error: '检索数据时出错' });
    }
  });
  

app.get('/additions', (req, res) => {
    jsonfile.readFile(FilePath, (err, data) => {
        if (err) {
            console.error('Error reading database:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(data.additions);
        }
    });
});

app.get('/orders', (req, res) => {
    jsonfile.readFile(FilePath, (err, data) => {
        if (err) {
            console.error('Error reading database:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(data.orders);
        }
    });
});

app.post('/600/orders', (req, res) => {
    // 假設 req.body 是 POST 請求中的資料
    const postData = req.body;

    // 讀取現有的資料庫檔案
    jsonfile.readFile(FilePath, (err, data) => {
        if (err) {
            console.error('讀取資料庫時出現錯誤:', err);
            res.status(500).send('內部伺服器錯誤');
        } else {
            // 將新資料加入到現有資料中
            data.orders.push(postData);

            // 寫入更新後的資料到資料庫檔案中
            jsonfile.writeFile(FilePath, data, (err) => {
                if (err) {
                    console.error('寫入資料庫時出現錯誤:', err);
                    res.status(500).send('內部伺服器錯誤');
                } else {
                    // 回傳成功訊息或其他適當回應
                    res.json(data.orders);
                }
            });
        }
    });
});

app.put('/orders/:orderId', (req, res) => {
    const db = require('./db.json');
    const orderId = req.params.orderId;
    const updatedOrder = req.body;
    // 在 db.json 中查找对应的订单
    const orderIndex = db.orders.findIndex(order => order.id === orderId);
    console.log(orderId,orderIndex)
    console.log(updatedOrder)
    console.log(orderIndex)
    if (orderIndex !== -1) {
      // 更新订单的 isDone 属性
      db.orders[orderIndex].isDone = updatedOrder.isDone;
       // 将更新后的数据写入到 db.json 中
       fs.writeFile(FilePath , JSON.stringify(db, null, 2), (err) => {
        if (err) {
          res.status(500).json({ message: '无法更新订单数据' });
        } else {
          // 响应成功消息，并返回更新后的订单列表
          res.status(200).json(db.orders);
        }
      });
    } else {
      // 如果找不到订单，返回错误消息
      res.status(404).json({ message: '找不到该订单' });
    }
  });

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // 读取用户数据文件
    jsonfile.readFile(FilePath, (err, data) => {
        if (err) {
            console.error('Failed to read users file:', err);
            res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred while processing your request' });
            return;
        }

        // 查询用户是否存在
        const user = data.users.find(user => user.email === email);
        if (user) {
            // 用户存在，检查密码是否匹配
            if (password === user.password) {
                // 密码匹配，生成 JWT 令牌
                const token = jwt.sign({ email: user.email }, 'secret_key', { expiresIn: '1h' });

                // 返回 JWT 令牌和用户信息给客户端
                res.json({ accessToken: token, user: { email: user.email, name: user.name, phone: user.phone, role: user.role, id: user.id } });
            } else {
                // 密码不匹配，返回错误消息
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid username or password' });
            }
        } else {
            // 用户不存在，返回错误消息
            res.status(401).json({ error: 'Unauthorized', message: 'Invalid username or password' });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
