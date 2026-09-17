import InfoScreen from '../components/InfoScreen';

export default function Terms() {
  return (
    <InfoScreen title="Terms & Conditions">
      <p style={{ margin: '0 0 14px' }}>
        Healthify is provided for educational and entertainment purposes. Nutrition figures shown
        in the app are approximate and meant to help kids learn general concepts about food — they
        are not medical or dietary advice.
      </p>
      <p style={{ margin: '0 0 14px' }}>
        By using Healthify, you agree not to misuse the app, attempt to disrupt its normal
        operation, or reproduce its content without permission.
      </p>
      <p style={{ margin: 0 }}>
        These terms may be updated from time to time as the app evolves. Continued use of the app
        after changes means you accept the updated terms.
      </p>
    </InfoScreen>
  );
}
