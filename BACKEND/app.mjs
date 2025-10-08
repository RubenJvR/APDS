import express from "express";
import helmet from "helmet";
import sanitizeHtml from "sanitize-html";
import {body, validaionReault} from "express-validator";

const app = express();
app.use(express.json());

app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],            // don't allow external or inline scripts
      styleSrc: ["'self'", "https:"],   // allow styles from your origin and https
      imgSrc: ["'self'", "data:"],      // allow images from self or data URIs
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
)

// route to accept a short comment (no HTML allowed)
app.post(
  "/comment",
  [
    body("username").trim().isLength({ min: 1, max: 40 }).escape(),
    body("comment").trim().isLength({ min: 1, max: 500 }).escape()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // safe: username and comment are escaped (HTML entities)
    const { username, comment } = req.body;
    // store to DB...
    res.json({ ok: true });
  }
);

// route to accept sanitized HTML (rich text)
app.post("/rich", (req, res) => {
  const raw = req.body.html || "";
  // sanitize-html removes scripts, dangerous attributes etc.
  const clean = sanitizeHtml(raw, {
    allowedTags: ["b", "i", "u", "a", "p", "ul", "li", "strong", "em"],
    allowedAttributes: { a: ["href", "rel", "target"] },
    allowedSchemesByTag: { a: ["http", "https", "mailto"] },
  });
  // store `clean` to DB
  res.json({ html: clean });
});

app.get('/',(req,res)=>{
    res.send("HTTPS in EXPRESSJS")
})

app.get('/fruit', (req,res)=>{
    res.send('tomato is not a fruit')
})

export default app;