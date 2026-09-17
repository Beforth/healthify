import InfoScreen from '../components/InfoScreen';

export default function About() {
  return (
    <InfoScreen title="About Healthify">
      <p style={{ margin: '0 0 16px' }}>
        Healthify is a 3D food-exploration game that helps kids see what's actually inside the food
        they eat — by cutting it open, looking at it under a microscope, and answering quick
        questions about its sugar, fat, calories, and vitamins.
      </p>

      <h3 style={{ color: 'var(--green-dark)', fontSize: '1.02rem', fontWeight: 800, margin: '18px 0 8px' }}>
        Our impact
      </h3>
      <p style={{ margin: '0 0 16px' }}>
        Nutrition labels are hard for kids (and adults!) to read. By turning real ingredient data
        into something tactile and visual, we want kids to build an instinct for what's in their
        food — so healthy choices start to feel obvious instead of like a lecture.
      </p>

      <h3 style={{ color: 'var(--green-dark)', fontSize: '1.02rem', fontWeight: 800, margin: '18px 0 8px' }}>
        Where we're headed
      </h3>
      <p style={{ margin: 0 }}>
        We're growing the food library, adding more nutrients to explore, and building ways for
        classrooms and families to track progress together — all while keeping the experience
        playful first.
      </p>
    </InfoScreen>
  );
}
