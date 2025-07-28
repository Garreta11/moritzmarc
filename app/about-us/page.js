import styles from "./page.module.scss";
import { getAboutpage } from "../utils/sanity-utils";
import { PortableText } from "@portabletext/react";

const AboutUsPage = async () => {
  const about = await getAboutpage('singleton-about');
  console.log(about);
  return (
    <div className={styles.page}>
      <PortableText value={about.description} />
    </div>
  );
};

export default AboutUsPage;