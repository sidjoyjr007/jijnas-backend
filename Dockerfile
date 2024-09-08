# Use the official Node.js image.
# https://hub.docker.com/_/node
FROM node:18

# Create and change to the app directory.
WORKDIR /usr/src/app

RUN npm install -g pm2

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
COPY package*.json ./

# Install production dependencies.
RUN npm install --only=production

# Copy the local code to the container image.
COPY . .

ENV MONGODB_USERNAME=jijnas_root
ENV MONGODB_PASSWORD=PmANKO7LAh78ukhr
ENV PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA5uOfd8T/RRm7ZOWWga/6QC8PfjEkv7031VEGTpCdTkTRrBcD\nRP0Wi08IT45NToyZX4bQ/DSpOuMFW1mJvR3nGJEObNfq0Jl5y33qcE+5VGGItbLI\noYlxoKSLsvzoXxJtLvbIBdxQCf+KNC1hxmgXoOuF5nJvZcDoqZiMKDOmC6Am9Mg3\ncoTLL7dd04KEYQW5v+evtnRR/pbfaaQEmvCpt3DNmV1njE1IdXmmbYhAP1hIAeoN\nuXoLIy6pqONYqRW1OIxpAbdL04rO6dBQIxq3cchVbS1qNnTe0Tj4t08h4lVZXS/A\nU4JjjZoQVpQFvgAFNrEmBBxNZxnErG4UqtvQ/wIDAQABAoIBAAO2mXP1qR1VYpwm\nzRrc16t8lkUzSSIESweVPAK7dKwzkyOvYxAS+e/Xn4yX/0pKHJVat7W2qxoVWJq1\nf++YsYTFoHPDrTUZosnRBpozzgk7YFV7wJpIeZlZzB1ez+Xnh/X/ZgwiFO90OqbI\nLBBi0C54WzjvkjcSuSsxFt/2pK7/Jo3o0mmr6oMwiJh9p62YF9AfVXRWkIJrjxP6\nxo2xUpHliT6qKkJlKXMeXu+cOr9raohOgOQxDDGdjoUL/Nj0D0GBkWW9G32QFoTI\ng+qrdk/EMb+m+bwQ7BFz2tuPWepxA+j8BSsdAKyvSoiZ5LRSxsMKcxuc7lXrLZ7+\nAg6azUECgYEA/FRU2qT9oy1srVx6zGUyMq4OwA9ihcteJkQWU6Nz6IMFnbRxELj+\ngKs47ooBJJOroEObo64dOa5VM+zUhawHrLdq1C2JxwIp0Cgd6eAp0v9GL5sd2d1P\n5VH4uF7iuJngw43HqLbamjwvved3527gO9bt93Gtcux9MhMauyWhbNECgYEA6j9y\nzGjk3Wr2tBov/xaZYSCgsJUXa8ddRxpqliLANnbxd707x9+XrvKdfKEuICC0cG7f\n2pLoI+BDz3SG1ayuxZLnjjJLVoHQs7yWimgCoKCIlJzvpu0k8SXjZOuPg5Cb2Nin\nNHuU5JjU5SmKjngOCQ3b64VOziDczk6beW6slM8CgYB/+uXu37Ali2yLoVRHRyxm\nuBGTKDp4UeW20uHgGg835vx6OIMAUFQFPtLpaeWaf6uU5bWTF0SLdPiSFZTVF6Ps\n3jq400AGR/qdMTu6249bDU6z5qEFV1KmpSTZnoavypxNkyOpVtUZVV2BnF0cbQge\nUazwzB+FIp19QGNWeIefgQKBgQDFecG8oz01kGP0RxNpV9Lr98aftsCs4sA3HgT3\nFsq136YHDKemA0/rc6rikzrAaPHUyxO6Pximjfx8mr7EybP46bR9wtaSUhPwQi8i\n9TYp1cvuhTLfpZH8HbXKsW8mObW4pESpUPmfkVwA6Pley8UBSwa4UYSy7y9WWRxm\nza9+LwKBgQD2N6HQnsQaNFKZfm+HWF4XdEwuBeimbNiA4EgqiyOyUmqE+3V5qA65\n4VgOax2CDc7xA5q4I6/7m1olLu+wg2eMpWu9pik9tT1Fb36+w7Qf/IwguRwVtZsW\nbC+oFbtDxV4jhsyhGxfmX3XHwhIfrZ6zhit/zBFMitCg3CvJzq7CXA==\n-----END RSA PRIVATE KEY-----"
ENV PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5uOfd8T/RRm7ZOWWga/6\nQC8PfjEkv7031VEGTpCdTkTRrBcDRP0Wi08IT45NToyZX4bQ/DSpOuMFW1mJvR3n\nGJEObNfq0Jl5y33qcE+5VGGItbLIoYlxoKSLsvzoXxJtLvbIBdxQCf+KNC1hxmgX\noOuF5nJvZcDoqZiMKDOmC6Am9Mg3coTLL7dd04KEYQW5v+evtnRR/pbfaaQEmvCp\nt3DNmV1njE1IdXmmbYhAP1hIAeoNuXoLIy6pqONYqRW1OIxpAbdL04rO6dBQIxq3\ncchVbS1qNnTe0Tj4t08h4lVZXS/AU4JjjZoQVpQFvgAFNrEmBBxNZxnErG4UqtvQ\n/wIDAQAB\n-----END PUBLIC KEY-----"
ENV ORGANIZATION_ID=org-3Jv7taok3EtZvkWnmL5hHEqp
ENV PROJECT_ID=proj_yKaoziqLrcFlafLguok2qcf9
ENV PROJECT_KEY=sk-proj-lIXo8t9MEgG1oc1P4xjpT3BlbkFJqduFURijUVP7bW0ooqOe
ENV CLIENT_ID=rzp_live_PjUfbMmCveGtHY
ENV CLIENT_SECRET=bdvrx4SgfPgXxgU1NzKrD7TZ
ENV USER_MAIL=services@quiznex.com
ENV USER_PASS=Sidjoyjr@@007
ENV PORT=8080

# Run the web service on container startup.
CMD [ "npm", "run", "dev" ]

# Document that the service listens on port 8080.
EXPOSE 8080