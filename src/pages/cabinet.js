import React from 'react';
import Layout from '@theme/Layout';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';

const AUTH_DOMAIN = 'polotno.eu.auth0.com';

// const isLocalhost =
//   typeof window !== undefined && window.location.href.indexOf('localhost') >= 0;

const isLocalhost = false;

const POLOTNO_API = isLocalhost
  ? 'http://localhost:3001/api'
  : 'https://api.polotno.dev/api';

const PRODUCTION_ID = 'QLNBl0Vci943fWC42GMZXiyWaNvtzXQb';
const LOCAL_ID = '3ST3bZS6HsQ50L5qkKZ8kKnOtDz831ki';

const ID = isLocalhost ? LOCAL_ID : PRODUCTION_ID;

const redirect = isLocalhost
  ? 'http://localhost:3000/cabinet'
  : 'https://polotno.dev/cabinet';

const UserDashboard = () => {
  const { user, logout, getAccessTokenSilently } = useAuth0();

  const [subscription, setSubscription] = React.useState(null);
  const [keys, setKeys] = React.useState(null);
  const [createStatus, setCreateState] = React.useState(null);
  const [removingKey, setRemovingKey] = React.useState(null);

  const loadKeys = async () => {
    const accessToken = await getAccessTokenSilently({});

    const req = await fetch(POLOTNO_API + '/get-user-keys', {
      method: 'GET',
      headers: {
        Authorization: accessToken,
      },
    });
    const res = await req.json();
    setKeys(res);
  };

  const loadSubscription = async () => {
    const accessToken = await getAccessTokenSilently({});

    const req = await fetch(POLOTNO_API + '/get-user-subscription', {
      method: 'GET',
      headers: {
        Authorization: accessToken,
      },
    });
    const res = await req.json();
    setSubscription(res);
  };

  React.useEffect(() => {
    loadKeys();
    loadSubscription();
  }, [user]);

  React.useEffect(() => {
    Paddle.Setup({
      vendor: 118216,
      eventCallback: function (data) {
        // The data.event will specify the event type
        if (data.event === 'Checkout.Complete') {
          loadSubscription();
        }
      },
    });
  }, []);

  const createKey = async () => {
    setCreateState('loading');
    const accessToken = await getAccessTokenSilently({});

    const req = await fetch(POLOTNO_API + '/create-user-key', {
      method: 'GET',
      headers: {
        Authorization: accessToken,
      },
    });
    const res = await req.json();
    setKeys(res);
    setCreateState(null);
  };

  const deleteKey = async (key) => {
    setRemovingKey(key);
    const accessToken = await getAccessTokenSilently({});

    const req = await fetch(POLOTNO_API + '/delete-user-key', {
      method: 'POST',
      headers: {
        Authorization: accessToken,
      },
      body: JSON.stringify({ key }),
    });
    const res = await req.json();
    setKeys(res);
    setRemovingKey(null);
  };

  return (
    <div>
      <h3>Hey, {user.nickname || user.name || user.email} </h3>
      <a className={styles.logoutButton} onClick={logout}>
        Logout
      </a>

      <div style={{ maxWidth: '600px', margin: 'auto' }}>
        {!keys && <h3>Loading API keys...</h3>}
        {keys && !keys.length && <h3>You don't have any API keys yet...</h3>}
        {keys && keys.length ? (
          <React.Fragment>
            <h3>API keys</h3>
            {keys.map((key) => (
              <div className={styles.keyRow} key={key}>
                <pre>{key}</pre>
                <button
                  onClick={() => {
                    deleteKey(key);
                  }}
                  disabled={removingKey === key}
                >
                  {removingKey === key ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </React.Fragment>
        ) : null}

        {keys && (
          <button onClick={createKey} disabled={createStatus === 'loading'}>
            {createStatus === 'loading' ? 'Creating...' : 'Create new key'}
          </button>
        )}
        <hr />
        {!subscription && <h3>Loading subscription data...</h3>}
        {subscription && !subscription.update_url && (
          <React.Fragment>
            <h3>You have no any subscriptions yet...</h3>
            <p>
              You can use Polotno only for local development or non-commercial
              project. For more information about available plans, please read{' '}
              <a href="/#price">Polotno prices</a>.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => {
                  Paddle.Checkout.open({
                    product: 600588,
                    email: user.email,
                  });
                }}
              >
                Buy Small Team plan for 100 USD.
              </button>
              <button
                onClick={() => {
                  Paddle.Checkout.open({
                    product: 616700,
                    email: user.email,
                  });
                }}
              >
                Buy Enterprise Team plan for 200 USD.
              </button>
            </div>
          </React.Fragment>
        )}
        {subscription && subscription.update_url && (
          <div>
            <h3>Subscription</h3>
            <p>
              You are subscribed to Polotno plan for{' '}
              {subscription.next_payment.amount}{' '}
              {subscription.next_payment.currency}.
            </p>
            <p>
              Next payment will be done on {subscription.next_payment.date}.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <a href={subscription.update_url}>Update subscription</a>
              <a href={subscription.cancel_url} style={{ color: 'red' }}>
                Cancel subscription
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function Cabinet() {
  const { isLoading, isAuthenticated, loginWithPopup, error } = useAuth0();

  return (
    <Layout>
      <div className={styles.cabinetPage}>
        <script
          src="https://cdn.paddle.com/paddle/paddle.js"
          type="text/javascript"
        ></script>
        {isLoading && <h3>Loading...</h3>}
        {isAuthenticated && <UserDashboard />}
        {!isLoading && !isAuthenticated && (
          <div style={{ textAlign: 'center ' }}>
            <h3>Do you want to generate API keys to use Polotno SDK?</h3>
            <a onClick={loginWithPopup} className={styles.loginButton}>
              Login
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default () => {
  return (
    <Auth0Provider domain={AUTH_DOMAIN} clientId={ID} redirectUri={redirect}>
      <Cabinet />
    </Auth0Provider>
  );
};
