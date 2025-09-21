import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const region = process.env.COGNITO_REGION!;
const userPoolId = process.env.COGNITO_USER_POOL_ID!;
const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

const client = jwksClient({
  jwksUri: `${issuer}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 10,
  cacheMaxAge: 10 * 60 * 1000,
});

function getKey(header: any, cb: (err: Error | null, key?: string) => void) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return cb(err);
    // @ts-ignore
    const signingKey = key.getPublicKey();
    cb(null, signingKey);
  });
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    // Allow CORS preflight and a public health endpoint
    if (req.method === "OPTIONS") return true;
    if (req.url?.startsWith("/health")) return true;

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) throw new UnauthorizedException("Missing token");

    const decoded: any = await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        { issuer, algorithms: ["RS256"] },
        (err, payload) => {
          if (err) return reject(new UnauthorizedException("Invalid token"));
          resolve(payload);
        }
      );
    });

    // Attach user info for controllers/services
    req.user = { sub: decoded.sub, email: decoded.email };
    return true;
  }
}
