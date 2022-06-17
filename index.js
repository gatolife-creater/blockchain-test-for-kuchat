const express = require('express')
const app = express()

const session = require("express-session");

const path = require('path');
const port = process.env.PORT || 3007;

const { Transaction } = require("./transaction");
const { Blockchain } = require("./blockchain");

const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

const bip39 = require("bip39");
const crypto = require("crypto");

// ブロックチェーンを生成
const kuchatBlockchain = new Blockchain();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.get("/api", (req, res) => {
    res.json({ blockchain: kuchatBlockchain.chain });
});

app.get("/generate-address", (req, res) => {

    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToEntropy(mnemonic);
    const key = Buffer.from('Bitcoin seed', 'utf8');
    const hmac = crypto.createHmac('sha512', key);
    const hash = hmac.update(seed).digest();
    const privateKey = hash.slice(0, 32);
    const publicKey = ec.keyFromPrivate(privateKey.toString()).getPublic("hex");
    kuchatBlockchain.minePendingTransactions(publicKey);
    res.json({ mnemonic: mnemonic.toString() });
});


app.post("/signin-attempt", (req, res) => {
    const seed = bip39.mnemonicToEntropy(req.body.mnemonic);
    const key = Buffer.from('Bitcoin seed', 'utf8');
    const hmac = crypto.createHmac('sha512', key);
    const hash = hmac.update(seed).digest();
    const privateKey = hash.slice(0, 32);

    const keyPair = ec.keyFromPrivate(privateKey.toString());

    req.session.public = keyPair.getPublic("hex");
    req.session.private = keyPair.getPrivate("hex");

    res.redirect("/");
});

app.get("/get-address", (req, res) => {
    res.json({ public: req.session.public });
});

app.post("/transaction", (req, res) => {
    let { toAddress, message, amount } = req.body;

    let transaction = new Transaction(req.session.public, toAddress, amount, message);
    // 署名する
    transaction.signTransaction(ec.keyFromPrivate(req.session.private));
    // 取引を保留する
    kuchatBlockchain.addTransaction(transaction);

    for (let i = 0; i < 3; i++) {
        kuchatBlockchain.minePendingTransactions(req.session.public);
    }
    res.redirect(`/transaction?address=${req.query.address}`);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(port, () => {
    console.log(`listening on *:${port}`);
});